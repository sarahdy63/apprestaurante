const PRODUCTS = [
  {
    id: 1,
    name: "Gastro Original",
    category: "Hamburguesas",
    price: 32000,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    desc: "180 g de Angus, queso cheddar, cebolla caramelizada y salsa secreta.",
  },

  {
    id: 2,
    name: "Truffle Swiss",
    category: "Hamburguesas",
    price: 38500,
    img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
    desc: "Hongos silvestres salteados, queso suizo y mayonesa de trufa.",
  },

  {
    id: 3,
    name: "Spicy Avocado",
    category: "Hamburguesas",
    price: 34900,
    img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80",
    desc: "Chile serrano, láminas de aguacate fresco y aderezo picante.",
  },

  {
    id: 4,
    name: "Bacon Deluxe",
    category: "Hamburguesas",
    price: 38200,
    img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=80",
    desc: "Doble tocineta ahumada, cheddar y cebollas crujientes.",
  },

  {
    id: 5,
    name: "Picada Imperial",
    category: "Picadas",
    price: 58000,
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    desc: "Carnes mixtas, papa criolla, chorizo y salsas de la casa.",
  },

  {
    id: 6,
    name: "Salchipapa Especial",
    category: "Salchipapas",
    price: 28000,
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
    desc: "Papas fritas, salchicha, tocineta, maíz y queso gratinado.",
  },

  {
    id: 7,
    name: "Limonada de Coco",
    category: "Bebidas",
    price: 9000,
    img: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9f?auto=format&fit=crop&w=900&q=80",
    desc: "Refrescante mezcla cremosa preparada al momento.",
  },

  {
    id: 8,
    name: "Extra Queso",
    category: "Toppings",
    price: 3500,
    img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=900&q=80",
    desc: "Porción adicional de queso fundido.",
  },
];
const money = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
let cart = JSON.parse(localStorage.getItem("gastroCart") || "[]");
function save() {
  localStorage.setItem("gastroCart", JSON.stringify(cart));
  renderCart();
  updateBadge();
}
function updateBadge() {
  document
    .querySelectorAll("[data-cart-count]")
    .forEach((x) => (x.textContent = cart.reduce((a, i) => a + i.qty, 0)));
}
function addToCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  const row = cart.find((x) => x.id === id);
  row ? row.qty++ : cart.push({ ...p, qty: 1 });
  save();
}
function changeQty(id, d) {
  const row = cart.find((x) => x.id === id);
  if (!row) return;
  row.qty += d;
  if (row.qty <= 0) cart = cart.filter((x) => x.id !== id);
  save();
}
function renderProducts(category = "Todos") {
  const root = document.querySelector("#products");
  if (!root) return;
  root.innerHTML = PRODUCTS.filter(
    (p) => category === "Todos" || p.category === category,
  )
    .map(
      (p) =>
        `<article class="product-card"><img src="${p.img}" alt="${p.name}"><div class="product-body"><div class="product-title-row"><strong>${p.name}</strong><span class="price">${money(p.price)}</span></div><p>${p.desc}</p><button class="btn btn-primary" onclick="addToCart(${p.id})">+ Agregar</button></div></article>`,
    )
    .join("");
}
function renderCart() {
  const root = document.querySelector("#cartItems");
  if (!root) return;
  if (!cart.length) {
    root.innerHTML = '<div class="empty">Tu pedido está vacío.</div>';
  } else {
    root.innerHTML = cart
      .map(
        (i) =>
          `<div class="cart-item"><img src="${i.img}" alt="${i.name}"><div><strong>${i.name}</strong><div class="small">${money(i.price)}</div><div class="qty"><button onclick="changeQty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${i.id},1)">+</button></div></div><strong>${money(i.price * i.qty)}</strong></div>`,
      )
      .join("");
  }
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0),
    shipping = subtotal ? 6000 : 0;
  document
    .querySelectorAll("[data-subtotal]")
    .forEach((x) => (x.textContent = money(subtotal)));
  document
    .querySelectorAll("[data-shipping]")
    .forEach((x) => (x.textContent = money(shipping)));
  document
    .querySelectorAll("[data-total]")
    .forEach((x) => (x.textContent = money(subtotal + shipping)));
}
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
function confirmOrder(e) {
  e.preventDefault();
  const code = "GD-" + Math.floor(10000 + Math.random() * 89999);
  localStorage.setItem(
    "lastOrder",
    JSON.stringify({
      code,
      cart,
      total: cart.reduce((a, i) => a + i.price * i.qty, 0) + 6000,
      date: new Date().toISOString(),
    }),
  );
  cart = [];
  save();
  location.href = "tracking.html";
}
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  updateBadge();
  document.querySelectorAll(".category-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.category);
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
  const order = JSON.parse(localStorage.getItem("lastOrder") || "null");
  if (order) {
    document
      .querySelectorAll("[data-order-code]")
      .forEach((x) => (x.textContent = "#" + order.code));
    document
      .querySelectorAll("[data-order-total]")
      .forEach((x) => (x.textContent = money(order.total)));
    const summary = document.querySelector("#orderSummaryItems");
    if (summary)
      summary.innerHTML = order.cart
        .map(
          (i) =>
            `<div class="summary-item"><span>${i.qty} × ${i.name}</span><strong>${money(i.price * i.qty)}</strong></div>`,
        )
        .join("");
  }
});
