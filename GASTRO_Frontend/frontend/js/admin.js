const ADMIN_API = "http://localhost:3000/api";
const token = () => localStorage.getItem("gastroAdminToken");
let adminProductsCache = [];
const adminMoney = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

async function adminApi(path, options = {}) {
  // FormData debe viajar sin Content-Type manual para que el navegador agregue el boundary multipart.
  const isFormData = options.body instanceof FormData;
  // Construye los encabezados comunes de autenticación.
  const headers = {
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    ...(options.headers || {}),
  };
  // Las peticiones JSON sí necesitan Content-Type application/json.
  if (!isFormData) headers["Content-Type"] = "application/json";
  // Ejecuta la petición contra la API administrativa.
  const response = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.includes("/auth/login")) {
    localStorage.removeItem("gastroAdminToken");
    location.href = "admin-login.html";
    throw new Error("La sesión expiró.");
  }
  if (!response.ok)
    throw new Error(data.message || "No fue posible completar la operación.");
  return data;
}

async function adminLogin(e) {
  e.preventDefault();
  try {
    const data = await adminApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#adminEmail").value,
        password: document.querySelector("#adminPassword").value,
      }),
    });
    localStorage.setItem("gastroAdminToken", data.token);
    location.href = "admin-orders.html";
  } catch (error) {
    alert(error.message);
  }
}

// Límites para decidir el estado del stock (se cambian solo aquí).
const STOCK_LIMITS = { bajo: 5, normal: 15 };

// Devuelve el estado según la cantidad: 0 agotado, 1-5 bajo, 6-15 normal, más óptimo.
function stockStatus(stock) {
  const n = Number(stock || 0);
  if (n <= 0) return { key: "agotado", label: "Agotado" };
  if (n <= STOCK_LIMITS.bajo) return { key: "bajo", label: "Bajo" };
  if (n <= STOCK_LIMITS.normal) return { key: "normal", label: "Normal" };
  return { key: "optimo", label: "Óptimo" };
}

// Guarda qué página y qué filtros está usando el admin en el inventario.
const inventoryState = { page: 1, limit: 10, q: "", category: "", status: "" };

async function loadAdminProducts() {
  const tbody = document.querySelector("#adminProducts");
  if (!tbody) return;
  if (!token()) return (location.href = "admin-login.html");
  try {
    adminProductsCache = await adminApi("/admin/products");
    fillCategoryFilter();
    renderInventory();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
  }
}

// Llena el filtro de categorías con las que existen en los productos.
function fillCategoryFilter() {
  const select = document.querySelector("#inventoryCategory");
  if (!select) return;
  const categories = [
    ...new Set(adminProductsCache.map((p) => p.category)),
  ].sort();
  select.innerHTML =
    `<option value="">Todas las categorías</option>` +
    categories
      .map(
        (c) =>
          `<option value="${c}" ${c === inventoryState.category ? "selected" : ""}>${c}</option>`,
      )
      .join("");
}

// Aplica los filtros, corta la página y dibuja la tabla.
function renderInventory() {
  const tbody = document.querySelector("#adminProducts");
  if (!tbody) return;
  const q = inventoryState.q.toLowerCase();
  const filtered = adminProductsCache
    .filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (inventoryState.category && p.category !== inventoryState.category)
        return false;
      if (
        inventoryState.status &&
        stockStatus(p.stock).key !== inventoryState.status
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );

  // Calcula cuántas páginas hay y evita quedarse en una página que ya no existe.
  const totalPages = Math.max(
    Math.ceil(filtered.length / inventoryState.limit),
    1,
  );
  if (inventoryState.page > totalPages) inventoryState.page = totalPages;
  const start = (inventoryState.page - 1) * inventoryState.limit;
  const pageRows = filtered.slice(start, start + inventoryState.limit);

  if (!pageRows.length) {
    tbody.innerHTML = `<tr><td colspan="7">No se encontraron productos.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows
      .map((p) => {
        const s = stockStatus(p.stock);
        return `<tr><td>${p.id}</td><td>${p.name}${p.active ? "" : ' <span class="small">(retirado)</span>'}</td><td>${p.category}</td><td>${adminMoney(p.price)}</td><td><strong>${p.stock}</strong></td><td><span class="stock-badge ${s.key}"><span class="dot"></span>${s.label}</span></td><td><button class="link-button" onclick="editProduct(${p.id})">Editar</button> · <button class="link-button danger" onclick="deleteProduct(${p.id})">Eliminar</button></td></tr>`;
      })
      .join("");
  }
  renderInventoryPagination(filtered.length, totalPages);
}

// Dibuja "Mostrando 1 al 10 de 40" y los botones de página.
function renderInventoryPagination(total, totalPages) {
  const box = document.querySelector("#inventoryPagination");
  if (!box) return;
  if (!total) {
    box.innerHTML = "";
    return;
  }
  const page = inventoryState.page;
  const from = (page - 1) * inventoryState.limit + 1;
  const to = Math.min(page * inventoryState.limit, total);
  let buttons = `<button class="page-btn" ${page <= 1 ? "disabled" : ""} onclick="goToInventoryPage(${page - 1})">« Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="page-btn ${i === page ? "active" : ""}" onclick="goToInventoryPage(${i})">${i}</button>`;
  }
  buttons += `<button class="page-btn" ${page >= totalPages ? "disabled" : ""} onclick="goToInventoryPage(${page + 1})">Siguiente »</button>`;
  box.innerHTML = `<span class="small">Mostrando ${from} al ${to} de ${total} productos</span><div class="page-buttons">${buttons}</div>`;
}

function goToInventoryPage(n) {
  inventoryState.page = n;
  renderInventory();
}

// Conecta el buscador y los filtros con la tabla.
function setupInventoryFilters() {
  const search = document.querySelector("#inventorySearch");
  const category = document.querySelector("#inventoryCategory");
  const status = document.querySelector("#inventoryStatus");
  const clear = document.querySelector("#inventoryClear");
  if (!search) return;
  search.addEventListener("input", () => {
    inventoryState.q = search.value.trim();
    inventoryState.page = 1;
    renderInventory();
  });
  category.addEventListener("change", () => {
    inventoryState.category = category.value;
    inventoryState.page = 1;
    renderInventory();
  });
  status.addEventListener("change", () => {
    inventoryState.status = status.value;
    inventoryState.page = 1;
    renderInventory();
  });
  clear.addEventListener("click", () => {
    search.value = "";
    category.value = "";
    status.value = "";
    Object.assign(inventoryState, { page: 1, q: "", category: "", status: "" });
    renderInventory();
  });
}

// Muestra una vista previa de la imagen seleccionada desde el computador.
function updateImagePreview() {
  // Obtiene el input de archivo y la etiqueta de vista previa.
  const input = document.querySelector("#productImage");
  const preview = document.querySelector("#imagePreview");
  // Sale si la pantalla actual no contiene estos elementos.
  if (!input || !preview) return;
  // Obtiene el primer archivo seleccionado por el administrador.
  const file = input.files?.[0];
  // Si no se seleccionó un archivo, conserva la imagen actual al editar o la oculta al crear.
  if (!file) {
    const currentImage = preview.dataset.currentImage || "";
    if (currentImage) {
      preview.src = currentImage;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    return;
  }
  // Valida de forma inmediata el tipo de archivo antes de enviarlo al backend.
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    input.value = "";
    alert("Selecciona una imagen JPG, JPEG, PNG o WEBP.");
    return updateImagePreview();
  }
  // Impide seleccionar imágenes mayores a 5 MB.
  if (file.size > 5 * 1024 * 1024) {
    input.value = "";
    alert("La imagen no puede superar los 5 MB.");
    return updateImagePreview();
  }
  // Crea una URL temporal local para mostrar la imagen sin subirla todavía.
  preview.src = URL.createObjectURL(file);
  // Hace visible la vista previa.
  preview.hidden = false;
}

function editProduct(id) {
  // Busca en memoria el producto que se desea editar.
  const product = adminProductsCache.find(
    (item) => Number(item.id) === Number(id),
  );
  // Sale si el producto ya no existe en la caché.
  if (!product) return;
  // Carga los datos actuales del producto en el formulario.
  document.querySelector("#productId").value = product.id;
  document.querySelector("#productName").value = product.name;
  document.querySelector("#productCategory").value = product.category;
  document.querySelector("#productPrice").value = product.price;
  document.querySelector("#productStock").value = product.stock ?? 0;
  document.querySelector("#productStockHint").textContent =
    "Cuántas unidades hay ahora en el local. Si llegó mercancía, suma lo que llegó a este número.";
  document.querySelector("#productDescription").value = product.desc || "";
  // Limpia el selector porque los navegadores no permiten asignar una ruta local a un input file.
  const imageInput = document.querySelector("#productImage");
  imageInput.value = "";
  // Guarda la ruta actual en el preview para conservarla cuando no se seleccione otra imagen.
  const preview = document.querySelector("#imagePreview");
  preview.dataset.currentImage = product.img || "";
  // Informa al administrador que la imagen actual se mantiene si no elige una nueva.
  const currentImageText = document.querySelector("#currentImageText");
  currentImageText.textContent = product.img
    ? `Imagen actual: ${product.img}. Selecciona otra solo si deseas reemplazarla.`
    : "Este producto aún no tiene una imagen cargada.";
  currentImageText.hidden = false;
  // Cambia el título del modal al modo edición.
  document.querySelector("#productModalTitle").textContent = "Editar producto";
  // Muestra la imagen actual del producto.
  updateImagePreview();
  // Abre el formulario modal.
  openModal("productModal");
}

function prepareNewProduct() {
  // Limpia todos los campos del formulario para crear un producto desde cero.
  document.querySelector("#productForm").reset();
  // Limpia el identificador oculto para indicar que se trata de una creación.
  document.querySelector("#productId").value = "";
  // Muestra la ayuda correspondiente al stock inicial.
  document.querySelector("#productStockHint").textContent =
    "Cantidad con la que arranca este producto en el local.";
  // Cambia el título del modal al modo creación.
  document.querySelector("#productModalTitle").textContent =
    "Agregar producto nuevo";
  // Limpia cualquier imagen que haya quedado de una edición anterior.
  const preview = document.querySelector("#imagePreview");
  preview.dataset.currentImage = "";
  preview.removeAttribute("src");
  preview.hidden = true;
  // Oculta el texto de la imagen actual porque el producto todavía no existe.
  const currentImageText = document.querySelector("#currentImageText");
  currentImageText.textContent = "";
  currentImageText.hidden = true;
  // Abre el modal de producto.
  openModal("productModal");
}

async function saveProduct(e) {
  // Evita que el formulario recargue la página.
  e.preventDefault();
  // Lee el id; si está vacío se creará un producto nuevo.
  const id = document.querySelector("#productId").value;
  // Convierte el stock a número.
  const stock = Number(document.querySelector("#productStock").value);
  // Valida que el stock sea un entero válido.
  if (!Number.isInteger(stock) || stock < 0)
    return alert("El stock debe ser un número entero, cero o mayor.");
  // Obtiene el archivo seleccionado por el administrador.
  const imageFile = document.querySelector("#productImage").files?.[0];
  // Al crear un producto la imagen es obligatoria para evitar tarjetas sin fotografía.
  if (!id && !imageFile)
    return alert("Selecciona una imagen para el nuevo producto.");
  // Crea un FormData porque además de texto se enviará un archivo binario.
  const formData = new FormData();
  // Agrega el nombre del producto.
  formData.append("name", document.querySelector("#productName").value.trim());
  // Agrega la categoría seleccionada.
  formData.append("category", document.querySelector("#productCategory").value);
  // Agrega el precio como texto; Multer lo deja disponible en req.body.
  formData.append("price", document.querySelector("#productPrice").value);
  // Agrega la descripción.
  formData.append("desc", document.querySelector("#productDescription").value);
  // Solo agrega el campo image cuando realmente existe un archivo seleccionado.
  if (imageFile) formData.append("image", imageFile);
  try {
    if (id) {
      // Edita los datos y opcionalmente reemplaza la imagen del producto.
      await adminApi(`/admin/products/${id}`, {
        method: "PUT",
        body: formData,
      });
      // Busca el stock anterior para evitar una llamada adicional si no cambió.
      const current = adminProductsCache.find(
        (item) => Number(item.id) === Number(id),
      );
      // Si el administrador cambió el stock, lo guarda con la ruta especializada de inventario.
      if (current && Number(current.stock) !== stock) {
        await adminApi(`/admin/products/${id}/stock`, {
          method: "PATCH",
          body: JSON.stringify({ set: stock }),
        });
      }
    } else {
      // En un producto nuevo el stock viaja junto con el resto de los campos.
      formData.append("stock", String(stock));
      // Crea el producto y carga su imagen en una sola petición.
      await adminApi("/admin/products", {
        method: "POST",
        body: formData,
      });
    }
    // Cierra el formulario después de una operación exitosa.
    closeModal("productModal");
    // Recarga la tabla para mostrar la información actualizada.
    await loadAdminProducts();
  } catch (error) {
    // Muestra al administrador cualquier mensaje devuelto por la API.
    alert(error.message);
  }
}

async function deleteProduct(id) {
  if (!confirm("¿Deseas retirar este producto del menú?")) return;
  try {
    await adminApi(`/admin/products/${id}`, { method: "DELETE" });
    await loadAdminProducts();
  } catch (error) {
    alert(error.message);
  }
}

// Guarda qué página y qué filtros está usando el admin.
const ordersState = {
  page: 1,
  limit: 10,
  q: "",
  // Permite seleccionar uno o varios estados desde las tarjetas superiores.
  statuses: [],
  date: "",
};

// Orden en que avanza un pedido y nombres para mostrar.
const ORDER_FLOW = ["RECIBIDO", "PREPARANDO", "EN_CAMINO", "ENTREGADO"];
const ORDER_LABELS = {
  RECIBIDO: "Recibido",
  PREPARANDO: "Preparando",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

// Arma el desplegable de estado: solo quedan activos el actual y el siguiente.
// "Cancelado" solo se activa cuando el pedido está en PREPARANDO.
// El resto se ve en gris y no se puede elegir. Si el pedido está cerrado, se bloquea todo.
function orderStatusSelect(o) {
  const closed = o.status === "ENTREGADO" || o.status === "CANCELADO";
  const index = ORDER_FLOW.indexOf(o.status);
  const options = [...ORDER_FLOW, "CANCELADO"]
    .map((value) => {
      const isCurrent = value === o.status;
      const isNext = index >= 0 && ORDER_FLOW[index + 1] === value;
      const isCancel = value === "CANCELADO" && o.status === "PREPARANDO";
      const enabled = isCurrent || isNext || isCancel;
      return `<option value="${value}" ${isCurrent ? "selected" : ""} ${enabled ? "" : "disabled"}>${ORDER_LABELS[value]}</option>`;
    })
    .join("");
  return `<select class="order-status-select status-${o.status.toLowerCase()}" ${closed ? "disabled" : ""} onchange="changeOrderStatus(${o.id}, this.value)">${options}</select>`;
}

async function loadDashboard() {
  const tbody = document.querySelector("#ordersBody");
  if (!tbody) return;
  if (!token()) return (location.href = "admin-login.html");
  try {
    // Arma la dirección con la página y los filtros activos.
    const params = new URLSearchParams({
      page: ordersState.page,
      limit: ordersState.limit,
    });
    if (ordersState.q) params.set("q", ordersState.q);
    // El backend admite varios estados separados por coma, por ejemplo RECIBIDO,PREPARANDO.
    if (ordersState.statuses.length)
      params.set("status", ordersState.statuses.join(","));
    if (ordersState.date) params.set("date", ordersState.date);
    const [summary, result] = await Promise.all([
      adminApi("/admin/dashboard/summary"),
      adminApi(`/admin/orders?${params}`),
    ]);
    document.querySelector("#statOrders").textContent = summary.ordersToday;
    document.querySelector("#statPending").textContent = summary.pending;
    document.querySelector("#statRoutes").textContent = summary.routes;
    document.querySelector("#statSales").textContent = adminMoney(
      summary.salesToday,
    );
    // Actualiza los contadores de las tarjetas de estado superiores.
    document.querySelector("#statusCountReceived").textContent =
      summary.received || 0;
    document.querySelector("#statusCountPreparing").textContent =
      summary.preparing || 0;
    document.querySelector("#statusCountRoute").textContent =
      summary.routes || 0;
    document.querySelector("#statusCountDelivered").textContent =
      summary.delivered || 0;
    document.querySelector("#statusCountCancelled").textContent =
      summary.cancelled || 0;
    // Ahora los pedidos vienen dentro de result.data.
    const orders = result.data;
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6">No se encontraron pedidos.</td></tr>`;
    } else {
      tbody.innerHTML = orders
        .map(
          (o) =>
            `<tr class="order-row status-${o.status.toLowerCase()}"><td>#${o.code}</td><td>${o.customer}</td><td><span class="items-chip">${Number(o.itemsCount || 0)} ${Number(o.itemsCount) === 1 ? "producto" : "productos"}</span></td><td>${adminMoney(o.total)}</td><td>${orderStatusSelect(o)}</td><td><button class="detail-btn" onclick="openOrderDetail('${o.code}')">Ver detalle</button></td></tr>`,
        )
        .join("");
    }
    renderOrdersPagination(result);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
}

// Dibuja "Mostrando 1 al 10 de 45" y los botones de página.
function renderOrdersPagination(result) {
  const box = document.querySelector("#ordersPagination");
  if (!box) return;
  const { total, page, limit, totalPages } = result;
  if (!total) {
    box.innerHTML = "";
    return;
  }
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  let buttons = `<button class="page-btn" ${page <= 1 ? "disabled" : ""} onclick="goToOrdersPage(${page - 1})">« Anterior</button>`;
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="page-btn ${i === page ? "active" : ""}" onclick="goToOrdersPage(${i})">${i}</button>`;
  }
  buttons += `<button class="page-btn" ${page >= totalPages ? "disabled" : ""} onclick="goToOrdersPage(${page + 1})">Siguiente »</button>`;
  box.innerHTML = `<span class="small">Mostrando ${from} al ${to} de ${total} pedidos</span><div class="page-buttons">${buttons}</div>`;
}

// Cambia de página y recarga la tabla.
function goToOrdersPage(n) {
  ordersState.page = n;
  loadDashboard();
}

// Conecta el buscador y los filtros con la tabla.
function setupOrderFilters() {
  const search = document.querySelector("#orderSearch");
  const status = document.querySelector("#orderStatusFilter");
  const date = document.querySelector("#orderDateFilter");
  const clear = document.querySelector("#orderClearFilters");
  if (!search) return;
  let timer;
  // El buscador espera 0,4 segundos después de escribir, para no consultar en cada letra.
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      ordersState.q = search.value.trim();
      ordersState.page = 1;
      loadDashboard();
    }, 400);
  });
  status.addEventListener("change", () => {
    // El selector tradicional funciona como selección rápida de un solo estado.
    ordersState.statuses = status.value ? [status.value] : [];
    ordersState.page = 1;
    syncOrderStatusCards();
    loadDashboard();
  });
  date.addEventListener("change", () => {
    ordersState.date = date.value;
    ordersState.page = 1;
    loadDashboard();
  });
  clear.addEventListener("click", () => {
    search.value = "";
    status.value = "";
    date.value = "";
    Object.assign(ordersState, { page: 1, q: "", statuses: [], date: "" });
    syncOrderStatusCards();
    loadDashboard();
  });
}

// Marca visualmente las tarjetas activas y mantiene sincronizado el selector tradicional.
function syncOrderStatusCards() {
  const cards = document.querySelectorAll("[data-order-status]");
  cards.forEach((card) => {
    const active = ordersState.statuses.includes(card.dataset.orderStatus);
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", String(active));
  });

  const select = document.querySelector("#orderStatusFilter");
  // Si solo hay un estado, también se refleja en el select. Con varios, queda en "Todos".
  if (select)
    select.value =
      ordersState.statuses.length === 1 ? ordersState.statuses[0] : "";

  const help = document.querySelector("#activeStatusHelp");
  if (help) {
    const labels = {
      RECIBIDO: "Recibidos",
      PREPARANDO: "Preparando",
      EN_CAMINO: "En camino",
      ENTREGADO: "Entregados",
      CANCELADO: "Cancelados",
    };
    help.textContent = ordersState.statuses.length
      ? `Mostrando: ${ordersState.statuses.map((s) => labels[s]).join(", ")}. Haz clic de nuevo para quitar un estado.`
      : "Sin estados seleccionados: mostrando todos los pedidos.";
  }
}

// Permite activar o desactivar varios filtros de estado a la vez.
function setupOrderStatusCards() {
  const cards = document.querySelectorAll("[data-order-status]");
  if (!cards.length) return;
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const value = card.dataset.orderStatus;
      const index = ordersState.statuses.indexOf(value);
      if (index >= 0) ordersState.statuses.splice(index, 1);
      else ordersState.statuses.push(value);
      ordersState.page = 1;
      syncOrderStatusCards();
      loadDashboard();
    });
  });
  syncOrderStatusCards();
}

async function changeOrderStatus(id, status) {
  // Antes de cancelar pide confirmación, porque la cancelación no se puede deshacer.
  if (
    status === "CANCELADO" &&
    !confirm("¿Seguro que deseas cancelar este pedido? No se puede deshacer.")
  ) {
    return loadDashboard();
  }
  try {
    await adminApi(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadDashboard();
  } catch (error) {
    alert(error.message);
    // Recarga la tabla para que el desplegable vuelva al estado real del pedido.
    await loadDashboard();
  }
}

// ---------- Ventana de detalle del pedido ----------
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Crea la ventana una sola vez y la reutiliza.
function ensureOrderDetailModal() {
  let modal = document.querySelector("#orderDetailModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "orderDetailModal";
  modal.className = "modal";
  modal.innerHTML =
    '<div class="modal-card od-card" id="orderDetailBody"></div>';
  // Se cierra al hacer clic en el fondo oscuro.
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeOrderDetail();
  });
  document.body.appendChild(modal);
  return modal;
}

function closeOrderDetail() {
  document.querySelector("#orderDetailModal")?.classList.remove("open");
}

async function openOrderDetail(code) {
  const modal = ensureOrderDetailModal();
  const body = document.querySelector("#orderDetailBody");
  body.innerHTML = '<div class="od-loading">Cargando pedido…</div>';
  modal.classList.add("open");
  try {
    const o = await adminApi(`/orders/code/${encodeURIComponent(code)}`);
    const statusKey = String(o.status || "").toLowerCase();
    const created = o.created_at
      ? new Date(o.created_at).toLocaleString("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";
    const items = o.items
      .map(
        (i) =>
          `<div class="od-item"><span class="od-qty">${i.quantity}×</span><div class="od-item-main"><strong>${escapeHtml(i.name)}</strong>${i.note ? `<span class="od-note">Nota: ${escapeHtml(i.note)}</span>` : ""}</div><strong>${adminMoney(i.lineTotal)}</strong></div>`,
      )
      .join("");
    body.innerHTML = `
      <div class="od-head">
        <div>
          <span class="od-eyebrow">Detalle del pedido</span>
          <h2>#${escapeHtml(o.code)}</h2>
          <span class="od-pill ${statusKey}">${ORDER_LABELS[o.status] || o.status}</span>
          ${created ? `<span class="od-date">${created}</span>` : ""}
        </div>
        <button class="od-close" onclick="closeOrderDetail()" aria-label="Cerrar">×</button>
      </div>
      <div class="od-label">Cliente</div>
      <div class="od-client">
        <strong>${escapeHtml(o.customer_first_name)} ${escapeHtml(o.customer_last_name)}</strong>
        <span>${escapeHtml(o.phone)}</span>
        <span>${escapeHtml(o.neighborhood)} · ${escapeHtml(o.address)}</span>
        <span>Pago: ${escapeHtml(o.payment_method)}</span>
      </div>
      <div class="od-label">Productos</div>
      <div class="od-items">${items}</div>
      <div class="od-totals">
        <div><span>Subtotal</span><strong>${adminMoney(o.subtotal)}</strong></div>
        <div><span>Domicilio</span><strong>${adminMoney(o.shipping_fee)}</strong></div>
        <div class="od-grand"><span>Total</span><strong>${adminMoney(o.total)}</strong></div>
      </div>
      <div class="od-actions">
        <a class="od-btn ghost" href="tracking.html?code=${encodeURIComponent(o.code)}" target="_blank">Ver seguimiento</a>
        <button class="od-btn" onclick="closeOrderDetail()">Cerrar</button>
      </div>`;
  } catch (error) {
    body.innerHTML = `<div class="od-loading">${escapeHtml(error.message)}</div><div class="od-actions"><button class="od-btn" onclick="closeOrderDetail()">Cerrar</button></div>`;
  }
}

function logout() {
  localStorage.removeItem("gastroAdminToken");
  location.href = "admin-login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#adminLogin")?.addEventListener("submit", adminLogin);
  document
    .querySelector("#productImage")
    ?.addEventListener("change", updateImagePreview);
  document
    .querySelector("#productForm")
    ?.addEventListener("submit", saveProduct);
  setupOrderFilters();
  setupOrderStatusCards();
  setupInventoryFilters();
  loadAdminProducts();
  loadDashboard();
});
