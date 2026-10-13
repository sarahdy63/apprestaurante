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

async function loadAdminProducts() {
  const tbody = document.querySelector("#adminProducts");
  if (!tbody) return;
  if (!token()) return (location.href = "admin-login.html");
  try {
    const rows = await adminApi("/admin/products");
    adminProductsCache = rows;
    tbody.innerHTML = rows
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>${p.category}</td><td>${adminMoney(p.price)}</td><td>${p.active ? "Activo" : "Inactivo"}</td><td><button class="link-button" onclick="editProduct(${p.id})">Editar</button> · <button class="link-button danger" onclick="deleteProduct(${p.id})">Eliminar</button></td></tr>`,
      )
      .join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
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
  document.querySelector("#productDescription").value = product.desc || "";
  document.querySelector("#productImage").value = product.img || "";
  document.querySelector("#productModalTitle").textContent = "Editar producto";
  openModal("productModal");
}

function prepareNewProduct() {
  document.querySelector("#productForm").reset();
  document.querySelector("#productId").value = "";
  document.querySelector("#productModalTitle").textContent =
    "Agregar producto nuevo";
  openModal("productModal");
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.querySelector("#productId").value;
  const body = {
    name: document.querySelector("#productName").value,
    category: document.querySelector("#productCategory").value,
    price: Number(document.querySelector("#productPrice").value),
    desc: document.querySelector("#productDescription").value,
    img: document.querySelector("#productImage").value,
  };
  try {
    await adminApi(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
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
    .querySelector("#productForm")
    ?.addEventListener("submit", saveProduct);
  setupOrderFilters();
  loadAdminProducts();
  loadDashboard();
});
