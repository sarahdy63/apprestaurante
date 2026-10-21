const API_BASE = "http://localhost:3000/api";
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem("gastroCart") || "[]");
// Valor mínimo del pedido (solo productos, sin domicilio) para poder pedir.
const MIN_ORDER = 30000;

// Barrios con cobertura que llegan del backend, y el barrio que eligió el cliente.
let NEIGHBORHOODS = [];
let selectedNeighborhood = null;

// Subtotal de los productos del carrito.
const getSubtotal = () => cart.reduce((a, i) => a + Number(i.price) * i.qty, 0);
const money = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
// Evita que el texto escrito por el cliente se interprete como HTML.
const escapeText = (text) =>
  String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Muestra un aviso flotante y amable en vez de un alert feo.
function showToast(message, duration = 3500) {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), duration);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || "No fue posible completar la operación.");
  return data;
}

function saveCart() {
  localStorage.setItem("gastroCart", JSON.stringify(cart));
  renderCart();
  updateBadge();
}

function updateBadge() {
  const count = cart.reduce((a, i) => a + i.qty, 0);
  document
    .querySelectorAll("[data-cart-count]")
    .forEach((x) => (x.textContent = count));
  const fab = document.querySelector("#cartFab");
  if (fab) fab.hidden = !count || fab.dataset.cartVisible === "1";
}

// En celular agrega el botón de tres rayitas que abre y cierra el menú de navegación.
function setupMobileNav() {
  const topbar = document.querySelector(".topbar");
  const links = topbar?.querySelector(".nav-links");
  if (!links) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-toggle";
  button.setAttribute("aria-label", "Abrir menú");
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = "<span></span><span></span><span></span>";
  button.addEventListener("click", () => {
    const open = topbar.classList.toggle("nav-open");
    button.setAttribute("aria-expanded", String(open));
  });
  (
    topbar.querySelector(".nav-right") || topbar.querySelector(".nav")
  ).appendChild(button);
  links
    .querySelectorAll("a")
    .forEach((a) =>
      a.addEventListener("click", () => topbar.classList.remove("nav-open")),
    );
}

// En el menú, en celular, muestra un botón flotante que baja hasta "Tu pedido".
function setupCartFab() {
  const cartPanel = document.querySelector("#cart");
  if (!cartPanel) return;
  const fab = document.createElement("button");
  fab.type = "button";
  fab.id = "cartFab";
  fab.className = "cart-fab";
  fab.hidden = true;
  fab.innerHTML =
    'Ver mi pedido <span class="cart-fab-count" data-cart-count>0</span>';
  fab.addEventListener("click", () =>
    cartPanel.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
  document.body.appendChild(fab);
  new IntersectionObserver(([entry]) => {
    fab.dataset.cartVisible = entry.isIntersecting ? "1" : "";
    updateBadge();
  }).observe(cartPanel);
}

function addToCart(id) {
  const product = PRODUCTS.find((x) => Number(x.id) === Number(id));
  if (!product) return;
  const row = cart.find((x) => Number(x.id) === Number(id));
  const inCart = row ? row.qty : 0;
  const available = Number(product.stock || 0);
  // Si ya no alcanza, avisa de una vez y no agrega nada.
  if (inCart + 1 > available) {
    showToast(
      available <= 0
        ? `Ups, lo sentimos  "${product.name}" está agotado por ahora.`
        : `Ups, lo sentimos no contamos con más unidades de "${product.name}". Disponibles: ${available}.`,
    );
    return;
  }
  if (row) {
    row.qty++;
    row.stock = available;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
}

function changeQty(id, delta) {
  const row = cart.find((x) => Number(x.id) === Number(id));
  if (!row) return;
  if (delta > 0) {
    // El menú solo tiene la categoría que se está viendo, por eso se busca primero ahí y si no, se usa lo guardado.
    const fresh = PRODUCTS.find((x) => Number(x.id) === Number(id));
    const known = fresh ? fresh.stock : row.stock;
    if (known !== undefined && row.qty + delta > Number(known)) {
      showToast(
        `Ups, lo sentimos no contamos con más unidades de "${row.name}". Disponibles: ${known}.`,
      );
      return;
    }
    if (fresh) row.stock = fresh.stock;
  }
  row.qty += delta;
  if (row.qty <= 0) cart = cart.filter((x) => Number(x.id) !== Number(id));
  saveCart();
}
// Producto del carrito cuyo comentario se está escribiendo.
let editingNoteId = null;

// Solo estas categorías permiten agregar comentario.
const NOTE_CATEGORIES = ["Hamburguesas", "Picadas", "Salchipapas"];

// Arma el bloque del comentario que va debajo de cada producto del carrito.
function cartNoteHtml(item) {
  if (!NOTE_CATEGORIES.includes(item.category)) return "";
  if (Number(editingNoteId) === Number(item.id))
    return `<div class="item-note"><div class="note-editor"><textarea id="note-${item.id}" maxlength="150" rows="2" placeholder="Ej: sin cebolla, salsas aparte">${escapeText(item.note)}</textarea><div class="note-actions"><button type="button" class="note-cancel" onclick="cancelNote()">Cancelar</button><button type="button" class="note-save" onclick="saveNote(${item.id})">Aceptar</button></div></div></div>`;
  if (item.note)
    return `<div class="item-note"><div class="cmt-saved"><span class="cmt-check">✓ Comentario agregado</span><button type="button" class="note-link" onclick="editNote(${item.id})">Editar comentario</button></div></div>`;
  return `<div class="item-note"><button type="button" class="note-link" onclick="editNote(${item.id})">+ Agregar comentario</button></div>`;
}

function editNote(id) {
  editingNoteId = id;
  renderCart();
  document.querySelector(`#note-${id}`)?.focus();
}

function cancelNote() {
  editingNoteId = null;
  renderCart();
}

function saveNote(id) {
  const row = cart.find((x) => Number(x.id) === Number(id));
  const field = document.querySelector(`#note-${id}`);
  if (row && field) row.note = field.value.trim().slice(0, 150);
  editingNoteId = null;
  saveCart();
}

// Comentario de un producto ya pedido: un botón "Ver comentario" que abre una nota con X para cerrarla.
let openNoteKey = null;

function noteDetailHtml(note, key, title = "") {
  if (!note) return "";
  const heading = title ? `<span class="note-pop-title">${title}</span>` : "";
  return `<div class="note-detail"><button type="button" class="note-chip" onclick="openNoteDetail('${key}')">💬 Ver comentario</button><div class="note-pop" data-note-key="${key}" hidden><button type="button" class="note-pop-close" onclick="closeNoteDetail()" aria-label="Cerrar">×</button>${heading}<p>${escapeText(note)}</p></div></div>`;
}

function openNoteDetail(key) {
  openNoteKey = key;
  restoreOpenNote();
}

function closeNoteDetail() {
  openNoteKey = null;
  restoreOpenNote();
}

// Deja abierta solo la nota elegida, incluso después de que la tabla se vuelve a dibujar.
function restoreOpenNote() {
  document
    .querySelectorAll(".note-pop")
    .forEach((pop) => (pop.hidden = pop.dataset.noteKey !== openNoteKey));
}

// Quita un producto del carrito de una vez, sin importar cuántas unidades tenga.
function removeFromCart(id) {
  cart = cart.filter((x) => Number(x.id) !== Number(id));
  saveCart();
}

async function loadProducts(category = "Todos") {
  const root = document.querySelector("#products");
  if (!root) return;
  root.innerHTML = '<div class="empty">Cargando productos...</div>';
  try {
    PRODUCTS = await api(
      `/products${category !== "Todos" ? `?category=${encodeURIComponent(category)}` : ""}`,
    );
    renderProducts();
  } catch (error) {
    root.innerHTML = `<div class="empty">${error.message}<br>Verifica que el backend esté encendido.</div>`;
  }
}

function renderProducts() {
  const root = document.querySelector("#products");
  if (!root) return;
  root.innerHTML = PRODUCTS.map((p) => {
    const stock = Number(p.stock || 0);
    const soldOut = stock <= 0;
    // Etiqueta sobre la foto: agotado, o pocas unidades.
    const tag = soldOut
      ? '<span class="stock-tag out">Agotado</span>'
      : stock <= 5
        ? `<span class="stock-tag low">¡Solo quedan ${stock}!</span>`
        : "";
    return `<article class="product-card ${soldOut ? "sold-out" : ""}"><div class="product-img-wrap"><img src="${p.img || ""}" alt="${p.name}">${tag}</div><div class="product-body"><div class="product-title-row"><strong>${p.name}</strong><span class="price">${money(p.price)}</span></div><p>${p.desc || ""}</p><button class="btn btn-primary" ${soldOut ? "disabled" : ""} onclick="addToCart(${p.id})">${soldOut ? "Agotado" : "+ Agregar"}</button></div></article>`;
  }).join("");
}

function renderCart() {
  const root = document.querySelector("#cartItems");
  if (!root) return;
  root.innerHTML = !cart.length
    ? '<div class="empty">Tu pedido está vacío.</div>'
    : cart
        .map(
          (i) =>
            `<div class="cart-item"><img src="${i.img || ""}" alt="${i.name}"><div><strong>${i.name}</strong><div class="small">${money(i.price)}</div><div class="qty"><button onclick="changeQty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${i.id},1)">+</button></div></div><div class="cart-item-end"><button class="remove-btn" onclick="removeFromCart(${i.id})" title="Quitar del pedido" aria-label="Quitar ${i.name} del pedido">×</button><strong>${money(i.price * i.qty)}</strong></div>${cartNoteHtml(i)}</div>`,
        )
        .join("");
  const subtotal = cart.reduce((a, i) => a + Number(i.price) * i.qty, 0);
  // El domicilio depende de la zona del barrio; mientras no haya barrio no se suma.
  const shipping =
    subtotal && selectedNeighborhood
      ? Number(selectedNeighborhood.shippingFee)
      : 0;

  // Aviso de pedido mínimo
  const hint = document.querySelector("#minOrderHint");
  if (hint) {
    const falta = MIN_ORDER - subtotal;
    hint.hidden = !subtotal || falta <= 0;
    hint.textContent = `Agrega ${money(falta)} más para alcanzar el pedido mínimo de ${money(MIN_ORDER)}.`;
  }

  document
    .querySelectorAll("[data-subtotal]")
    .forEach((x) => (x.textContent = money(subtotal)));
  document
    .querySelectorAll("[data-shipping]")
    .forEach(
      (x) =>
        (x.textContent = selectedNeighborhood
          ? money(shipping)
          : "Según tu barrio"),
    );
  document
    .querySelectorAll("[data-zone]")
    .forEach(
      (x) =>
        (x.textContent = selectedNeighborhood
          ? `(zona ${selectedNeighborhood.zone})`
          : ""),
    );
  document
    .querySelectorAll("[data-total]")
    .forEach((x) => (x.textContent = money(subtotal + shipping)));
}
// Trae los barrios con cobertura y llena la lista "Barrio" del formulario.
async function loadNeighborhoods() {
  const select = document.querySelector("#barrioSelect");
  if (!select) return;
  try {
    NEIGHBORHOODS = await api("/neighborhoods");
    // Agrupa los barrios por zona para que la lista sea fácil de leer.
    const zones = [...new Set(NEIGHBORHOODS.map((n) => n.zone))];
    select.innerHTML =
      '<option value="">Selecciona tu barrio</option>' +
      zones
        .map((zone) => {
          const options = NEIGHBORHOODS.filter((n) => n.zone === zone)
            .map((n) => `<option value="${n.id}">${n.name}</option>`)
            .join("");
          const fee = NEIGHBORHOODS.find((n) => n.zone === zone).shippingFee;
          return `<optgroup label="${zone} - domicilio ${money(fee)}">${options}</optgroup>`;
        })
        .join("");
  } catch (error) {
    select.innerHTML =
      '<option value="">No se pudieron cargar los barrios</option>';
  }
}

// Dibuja el mismo footer en todas las páginas que tengan <footer id="siteFooter">.
function renderFooter() {
  const footer = document.querySelector("#siteFooter");
  if (!footer) return;
  footer.innerHTML = `
    <div class="container footer-grid">
      <div>
        <a class="footer-brand" href="index.html" aria-label="Patacón Pisa'o, ir al inicio">
          <span class="brand-top">Patacón</span>
          <span class="brand-bottom">Pisa'o</span>
        </a>
        <p>Una experiencia de comida rápida moderna, ágil y cercana.</p>
      </div>
      <div class="footer-links">
        <h4>Navegación</h4>
        <a href="index.html">Inicio</a>
        <a href="menu.html">Menú</a>
        <a href="location.html">Ubicación</a>
        <a href="about.html">Quiénes somos</a>
      </div>
      <div class="footer-links">
        <h4>Legal</h4>
        <a href="privacidad.html">Privacidad</a>
        <a href="terminos.html">Términos</a>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>315 648 11 63<br />jhonsuarez@gmail.com<br />Neiva, Huila</p>
      </div>
    </div>`;
}

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
async function intentarConfirmar() {
  if (!cart.length)
    return alert("Tu carrito está vacío. Agrega productos antes de continuar.");

  // Validación 0: horario de domicilios.
  try {
    const hours = await api("/delivery-hours");
    if (!hours.open) {
      showToast(hours.message, 6000);
      return;
    }
  } catch (error) {
    showToast(
      "No pudimos verificar el horario. Intenta de nuevo en un momento.",
    );
    return;
  }

  // Validación 1: pedido mínimo.
  const subtotal = getSubtotal();
  if (subtotal < MIN_ORDER) {
    showToast(
      `El pedido mínimo para domicilio es de ${money(MIN_ORDER)}. Te faltan ${money(MIN_ORDER - subtotal)}.`,
    );
    return;
  }

  // Validación 2: términos y condiciones.
  const terminos = document.querySelector("#terminosCheck");
  if (terminos && !terminos.checked) {
    showToast(
      "Para continuar con tu pedido, debes aceptar los términos y condiciones.",
    );
    terminos.closest(".terms-check")?.classList.add("error");
    terminos.focus();
    return;
  }

  openModal("checkoutModal");
}
function soloLetras(input) {
  input?.addEventListener("input", () => {
    input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
  });
}
function soloNumeros(input, maxLength) {
  input?.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "").slice(0, maxLength);
  });
}

async function confirmOrder(e) {
  e.preventDefault();
  // Se envía el id del barrio; el backend busca su nombre y la tarifa del domicilio.
  const neighborhoodId = Number(document.querySelector("#barrioSelect").value);
  const body = {
    customer: {
      firstName: document.querySelector("#nombreInput").value.trim(),
      lastName: document.querySelector("#apellidoInput").value.trim(),
      phone: document.querySelector("#telefonoInput").value.trim(),
      neighborhoodId,
      address: document.querySelector("#direccionInput").value.trim(),
    },
    paymentMethod: document.querySelector("#metodoPagoSelect").value,
    items: cart.map((item) => ({
      productId: item.id,
      quantity: item.qty,
      note: NOTE_CATEGORIES.includes(item.category) ? item.note || "" : "",
    })),
  };
  try {
    const order = await api("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
    localStorage.setItem("lastOrderCode", order.code);
    cart = [];
    saveCart();
    location.href = `tracking.html?code=${encodeURIComponent(order.code)}`;
  } catch (error) {
    showToast(error.message);
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
// Texto y color de la etiqueta de estado, arriba a la derecha.
const STATUS_CHIP = {
  RECIBIDO: ["Pedido recibido", ""],
  PREPARANDO: ["Preparando tu pedido", "cooking"],
  EN_CAMINO: ["En camino", "route"],
  ENTREGADO: ["Entregado", "done"],
  CANCELADO: ["Cancelado", "cancelled"],
};

function updateStatusChip(status) {
  const chip = document.querySelector("#statusChip");
  const text = document.querySelector("#statusChipText");
  if (!chip || !text) return;
  const [label, css] = STATUS_CHIP[status] || STATUS_CHIP.RECIBIDO;
  text.textContent = label;
  chip.className = `status-chip ${css}`.trim();
}
let trackingCode = "";

// Muestra el botón de cancelar solo mientras el pedido está RECIBIDO.
function updateCancelUI(status) {
  const box = document.querySelector("#cancelBox");
  if (box) box.hidden = status !== "RECIBIDO";
}

// Elige qué pantalla mostrar: el seguimiento normal, entregado o cancelado.
function showTrackingView(status) {
  const normal = document.querySelector("#trackingNormal");
  const delivered = document.querySelector("#deliveredView");
  const cancelled = document.querySelector("#cancelledView");
  if (!normal || !delivered || !cancelled) return;
  normal.hidden = status === "ENTREGADO" || status === "CANCELADO";
  delivered.hidden = status !== "ENTREGADO";
  cancelled.hidden = status !== "CANCELADO";
}

// Pide confirmación y cancela el pedido con el código.
async function cancelOrder() {
  if (!trackingCode) return;
  if (!confirm("¿Seguro que quieres cancelar tu pedido?")) return;
  try {
    const result = await api(
      `/orders/code/${encodeURIComponent(trackingCode)}/cancel`,
      { method: "PATCH" },
    );
    showToast(result.message);
  } catch (error) {
    showToast(error.message);
  }
  await loadTracking();
}

async function loadTracking() {
  if (!document.querySelector(".tracking")) return;
  const params = new URLSearchParams(location.search);
  const code = params.get("code") || localStorage.getItem("lastOrderCode");
  if (!code) return;
  try {
    const order = await api(`/orders/code/${encodeURIComponent(code)}`);
    document
      .querySelectorAll("[data-order-code]")
      .forEach((x) => (x.textContent = `#${order.code}`));
    document
      .querySelectorAll("[data-order-subtotal]")
      .forEach((x) => (x.textContent = money(order.subtotal)));
    document
      .querySelectorAll("[data-order-shipping]")
      .forEach((x) => (x.textContent = money(order.shipping_fee)));
    document
      .querySelectorAll("[data-order-total]")
      .forEach((x) => (x.textContent = money(order.total)));

    // Cada producto con su cantidad en un cuadrito.
    const summary = document.querySelector("#orderSummaryItems");
    if (summary)
      summary.innerHTML = order.items
        .map(
          (i, index) =>
            `<div class="summary-item"><span class="qty-badge">${i.quantity}×</span><span class="summary-name">${i.name}${noteDetailHtml(i.note, `t${index}`)}</span><strong>${money(i.lineTotal)}</strong></div>`,
        )
        .join("");
    restoreOpenNote();

    // Datos de entrega, uno debajo del otro.
    const delivery = document.querySelector("#orderDeliveryInfo");
    if (delivery) {
      const row = (label, value) =>
        `<div class="info-row"><span class="info-label">${label}</span><strong>${value}</strong></div>`;
      delivery.innerHTML =
        row(
          "Cliente",
          `${order.customer_first_name} ${order.customer_last_name}`,
        ) +
        row("Teléfono", order.phone) +
        row("Barrio", order.neighborhood) +
        row("Dirección", order.address) +
        `<div class="pay-badge"><span>Método de pago</span><span>${order.payment_method}</span></div>`;
    }

    setTrackingStatus(order.status);
    updateStatusChip(order.status);
    trackingCode = order.code;
    updateCancelUI(order.status);
    showTrackingView(order.status);
  } catch (error) {
    showToast(error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  setupCartFab();
  loadProducts();
  renderFooter();
  renderCart();
  updateBadge();
  loadTracking();
  // En la página de seguimiento, revisa el estado del pedido cada 15 segundos.
  if (document.querySelector(".tracking")) setInterval(loadTracking, 15000);

  document
    .querySelector("#cancelOrderBtn")
    ?.addEventListener("click", cancelOrder);
  document.querySelectorAll(".category-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadProducts(btn.dataset.category);
    }),
  );
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () => closeModal(b.dataset.close)),
    );
  document
    .querySelector("#checkoutForm")
    ?.addEventListener("submit", confirmOrder);
  soloLetras(document.querySelector("#nombreInput"));
  soloLetras(document.querySelector("#apellidoInput"));
  soloNumeros(document.querySelector("#telefonoInput"), 10);
  document.querySelector("#terminosCheck")?.addEventListener("change", (e) => {
    e.target.closest(".terms-check")?.classList.remove("error");
  });
  // Al elegir el barrio se recalcula el domicilio y el total.
  loadNeighborhoods();
  document.querySelector("#barrioSelect")?.addEventListener("change", (e) => {
    selectedNeighborhood =
      NEIGHBORHOODS.find((n) => n.id === Number(e.target.value)) || null;
    renderCart();
  });
});
