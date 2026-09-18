const API_BASE = "http://localhost:3000/api";
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem("gastroCart") || "[]");
const money = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "No fue posible completar la operación.");
  return data;
}

function saveCart() {
  localStorage.setItem("gastroCart", JSON.stringify(cart));
  renderCart();
  updateBadge();
}

function updateBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((x) => (x.textContent = cart.reduce((a, i) => a + i.qty, 0)));
}

function addToCart(id) {
  const product = PRODUCTS.find((x) => Number(x.id) === Number(id));
  if (!product) return;
  const row = cart.find((x) => Number(x.id) === Number(id));
  row ? row.qty++ : cart.push({ ...product, qty: 1 });
  saveCart();
}

function changeQty(id, delta) {
  const row = cart.find((x) => Number(x.id) === Number(id));
  if (!row) return;
  row.qty += delta;
  if (row.qty <= 0) cart = cart.filter((x) => Number(x.id) !== Number(id));
  saveCart();
}

async function loadProducts(category = "Todos") {
  const root = document.querySelector("#products");
  if (!root) return;
  root.innerHTML = '<div class="empty">Cargando productos...</div>';
  try {
    PRODUCTS = await api(`/products${category !== "Todos" ? `?category=${encodeURIComponent(category)}` : ""}`);
    renderProducts();
  } catch (error) {
    root.innerHTML = `<div class="empty">${error.message}<br>Verifica que el backend esté encendido.</div>`;
  }
}

function renderProducts() {
  const root = document.querySelector("#products");
  if (!root) return;
  root.innerHTML = PRODUCTS.map((p) => `<article class="product-card"><img src="${p.img || ""}" alt="${p.name}"><div class="product-body"><div class="product-title-row"><strong>${p.name}</strong><span class="price">${money(p.price)}</span></div><p>${p.desc || ""}</p><button class="btn btn-primary" onclick="addToCart(${p.id})">+ Agregar</button></div></article>`).join("");
}

function renderCart() {
  const root = document.querySelector("#cartItems");
  if (!root) return;
  root.innerHTML = !cart.length ? '<div class="empty">Tu pedido está vacío.</div>' : cart.map((i) => `<div class="cart-item"><img src="${i.img || ""}" alt="${i.name}"><div><strong>${i.name}</strong><div class="small">${money(i.price)}</div><div class="qty"><button onclick="changeQty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${i.id},1)">+</button></div></div><strong>${money(i.price * i.qty)}</strong></div>`).join("");
  const subtotal = cart.reduce((a, i) => a + Number(i.price) * i.qty, 0);
  const shipping = subtotal ? 6000 : 0;
  document.querySelectorAll("[data-subtotal]").forEach((x) => (x.textContent = money(subtotal)));
  document.querySelectorAll("[data-shipping]").forEach((x) => (x.textContent = money(shipping)));
  document.querySelectorAll("[data-total]").forEach((x) => (x.textContent = money(subtotal + shipping)));
}

function openModal(id) { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }
function intentarConfirmar() { if (!cart.length) return alert("Tu carrito está vacío. Agrega productos antes de continuar."); openModal("checkoutModal"); }
function soloLetras(input) { input?.addEventListener("input", () => { input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, ""); }); }
function soloNumeros(input, maxLength) { input?.addEventListener("input", () => { input.value = input.value.replace(/[^0-9]/g, "").slice(0, maxLength); }); }

async function confirmOrder(e) {
  e.preventDefault();
  const barrioSelect = document.querySelector("#barrioSelect");
  const neighborhood = barrioSelect.value === "otro" ? document.querySelector("#barrioOtroInput").value : barrioSelect.value;
  const body = {
    customer: {
      firstName: document.querySelector("#nombreInput").value.trim(),
      lastName: document.querySelector("#apellidoInput").value.trim(),
      phone: document.querySelector("#telefonoInput").value.trim(),
      neighborhood,
      address: document.querySelector("#direccionInput").value.trim()
    },
    paymentMethod: document.querySelector("#metodoPagoSelect").value,
    items: cart.map((item) => ({ productId: item.id, quantity: item.qty }))
  };
  try {
    const order = await api("/orders", { method: "POST", body: JSON.stringify(body) });
    localStorage.setItem("lastOrderCode", order.code);
    cart = [];
    saveCart();
    location.href = `tracking.html?code=${encodeURIComponent(order.code)}`;
  } catch (error) {
    alert(error.message);
  }
}

function setTrackingStatus(status) {
  const order = ["RECIBIDO", "PREPARANDO", "EN_CAMINO", "ENTREGADO"];
  const current = order.indexOf(status);
  document.querySelectorAll(".progress .step").forEach((step, index) => {
    step.classList.remove("done", "active");
    if (index < current) step.classList.add("done");
    if (index === current) step.classList.add("active");
  });
}

async function loadTracking() {
  if (!document.querySelector(".tracking")) return;
  const params = new URLSearchParams(location.search);
  const code = params.get("code") || localStorage.getItem("lastOrderCode");
  if (!code) return;
  try {
    const order = await api(`/orders/code/${encodeURIComponent(code)}`);
    document.querySelectorAll("[data-order-code]").forEach((x) => (x.textContent = `#${order.code}`));
    document.querySelectorAll("[data-order-total]").forEach((x) => (x.textContent = money(order.total)));
    const summary = document.querySelector("#orderSummaryItems");
    if (summary) summary.innerHTML = order.items.map((i) => `<div class="summary-item"><span>${i.quantity} × ${i.name}</span><strong>${money(i.lineTotal)}</strong></div>`).join("");
    const delivery = document.querySelector("#orderDeliveryInfo");
    if (delivery) delivery.innerHTML = `<p><strong>Cliente:</strong> ${order.customer_first_name} ${order.customer_last_name}</p><p><strong>Teléfono:</strong> ${order.phone}</p><p><strong>Barrio:</strong> ${order.neighborhood}</p><p><strong>Dirección:</strong> ${order.address}</p><p><strong>Método de pago:</strong> ${order.payment_method}</p>`;
    setTrackingStatus(order.status);
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCart();
  updateBadge();
  loadTracking();
  document.querySelectorAll(".category-btn").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadProducts(btn.dataset.category);
  }));
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));
  document.querySelector("#checkoutForm")?.addEventListener("submit", confirmOrder);
  soloLetras(document.querySelector("#nombreInput"));
  soloLetras(document.querySelector("#apellidoInput"));
  soloNumeros(document.querySelector("#telefonoInput"), 10);
  const barrioSelect = document.querySelector("#barrioSelect");
  const barrioOtroWrap = document.querySelector("#barrioOtroWrap");
  const barrioOtroInput = document.querySelector("#barrioOtroInput");
  barrioSelect?.addEventListener("change", () => {
    const other = barrioSelect.value === "otro";
    barrioOtroWrap.style.display = other ? "flex" : "none";
    barrioOtroInput.required = other;
    if (!other) barrioOtroInput.value = "";
  });
});
