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
  const response = await fetch(`${ADMIN_API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
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

// Muestra una vista previa de la imagen según lo que haya en el campo.
function updateImagePreview() {
  const input = document.querySelector("#productImage");
  const preview = document.querySelector("#imagePreview");
  if (!input || !preview) return;
  const value = input.value.trim();
  if (value) {
    preview.src = value;
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
}

function editProduct(id) {
  const product = adminProductsCache.find(
    (item) => Number(item.id) === Number(id),
  );
  if (!product) return;
  document.querySelector("#productId").value = product.id;
  document.querySelector("#productName").value = product.name;
  document.querySelector("#productCategory").value = product.category;
  document.querySelector("#productPrice").value = product.price;
  document.querySelector("#productStock").value = product.stock ?? 0;
  document.querySelector("#productStockHint").textContent =
    "Cuántas unidades hay ahora en el local. Si llegó mercancía, suma lo que llegó a este número.";
  document.querySelector("#productDescription").value = product.desc || "";
  document.querySelector("#productImage").value = product.img || "";
  document.querySelector("#productModalTitle").textContent = "Editar producto";
  updateImagePreview();
  openModal("productModal");
}

function prepareNewProduct() {
  document.querySelector("#productForm").reset();
  document.querySelector("#productId").value = "";
  document.querySelector("#productStockHint").textContent =
    "Cantidad con la que arranca este producto en el local.";
  document.querySelector("#productModalTitle").textContent =
    "Agregar producto nuevo";
  updateImagePreview();
  openModal("productModal");
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.querySelector("#productId").value;
  const stock = Number(document.querySelector("#productStock").value);
  if (!Number.isInteger(stock) || stock < 0)
    return alert("El stock debe ser un número entero, cero o mayor.");
  const body = {
    name: document.querySelector("#productName").value,
    category: document.querySelector("#productCategory").value,
    price: Number(document.querySelector("#productPrice").value),
    desc: document.querySelector("#productDescription").value,
    img: document.querySelector("#productImage").value,
  };
  try {
    if (id) {
      // Edita los datos del producto.
      await adminApi(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      // Si el admin cambió el stock, lo guarda con la ruta del stock.
      const current = adminProductsCache.find(
        (item) => Number(item.id) === Number(id),
      );
      if (current && Number(current.stock) !== stock) {
        await adminApi(`/admin/products/${id}/stock`, {
          method: "PATCH",
          body: JSON.stringify({ set: stock }),
        });
      }
    } else {
      // Producto nuevo: el stock viaja junto con los datos.
      body.stock = stock;
      await adminApi("/admin/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    closeModal("productModal");
    await loadAdminProducts();
  } catch (error) {
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
const ordersState = { page: 1, limit: 10, q: "", status: "", date: "" };

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
    if (ordersState.status) params.set("status", ordersState.status);
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
    // Ahora los pedidos vienen dentro de result.data.
    const orders = result.data;
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6">No se encontraron pedidos.</td></tr>`;
    } else {
      tbody.innerHTML = orders
        .map(
          (o) =>
            `<tr><td>#${o.code}</td><td>${o.customer}</td><td>${o.products}</td><td>${adminMoney(o.total)}</td><td><select onchange="changeOrderStatus(${o.id}, this.value)"><option value="RECIBIDO" ${o.status === "RECIBIDO" ? "selected" : ""}>Recibido</option><option value="PREPARANDO" ${o.status === "PREPARANDO" ? "selected" : ""}>Preparando</option><option value="EN_CAMINO" ${o.status === "EN_CAMINO" ? "selected" : ""}>En camino</option><option value="ENTREGADO" ${o.status === "ENTREGADO" ? "selected" : ""}>Entregado</option><option value="CANCELADO" ${o.status === "CANCELADO" ? "selected" : ""}>Cancelado</option></select></td><td><a href="tracking.html?code=${encodeURIComponent(o.code)}" target="_blank">Ver</a></td></tr>`,
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
    ordersState.status = status.value;
    ordersState.page = 1;
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
    Object.assign(ordersState, { page: 1, q: "", status: "", date: "" });
    loadDashboard();
  });
}

async function changeOrderStatus(id, status) {
  try {
    await adminApi(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadDashboard();
  } catch (error) {
    alert(error.message);
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
    ?.addEventListener("input", updateImagePreview);
  document
    .querySelector("#productForm")
    ?.addEventListener("submit", saveProduct);
  setupOrderFilters();
  setupInventoryFilters();
  loadAdminProducts();
  loadDashboard();
});
