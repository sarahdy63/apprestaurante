const PRODUCTS = [
  {
    id: 1,
    name: "Gastro Original",
    category: "Hamburguesas",
    price: 32000,
    img: "assets/img/Hamburguesa-la_infiel.jpg",
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
    price: 28000,
    img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80",
    desc: "Chile serrano, láminas de aguacate fresco y aderezo picante.",
  },

  {
    id: 4,
    name: "Bacon Deluxe",
    category: "Hamburguesas",
    price: 32000,
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
    price: 3000,
    img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=900&q=80",
    desc: "Porción adicional de queso fundido.",
  },
  {
    id: 9,
    name: "La Cachona",
    category: "Hamburguesas",
    price: 30000,
    img: "https://www.magnific.com/es/foto-gratis/juicy-cheeseburger-tabla-madera-rustica_269342352.htm#fromView=keyword&page=1&position=0&uuid=aa759b91-4a73-4531-b752-b7dd78e0224b&query=Hamburguesa",
    desc: "Carne de res a la parrilla, doble queso derretido, tocineta crocante, salsa picante casera y cebolla caramelizada.",
  },
  {
    id: 10,
    name: "La Infiel",
    category: "Hamburguesas",
    price: 22000,
    img: "https://es.pinterest.com/pin/1088041591236464004/",
    desc: "Carne de res y pollo apanado, servida con salsa BBQ y salsa de ajo.",
  },
  {
    id: 11,
    name: "La Chismosa",
    category: "Hamburguesas",
    price: 27000,
    img: "https://es.dreamstime.com/deliciosa-hamburguesa-de-huevos-generada-por-inteligencia-artificial-la-un-jugoso-plato-carne-res-coronado-con-queso-crujiente-image274870113",
    desc: "Carne de res, tocineta, queso, piña, jalapeño, huevo frito y cebolla morada.",
  },
  {
    id: 12,
    name: "La Arrepentida",
    category: "Hamburguesas",
    price: 25000,
    img: "https://www.magnific.com/es/imagen-ia-gratis/hamburguesa-queso-tocino-doble_414996129.htm#fromView=keyword&page=1&position=26&uuid=aa759b91-4a73-4531-b752-b7dd78e0224b&query=Hamburguesa",
    desc: "Doble carne, triple queso, tocineta y salsa de la casa.",
  },
  {
    id: 13,
    name: "La Patacona",
    category: "Hamburguesas",
    price: 20000,
    img: "https://www.cocinarico.es/receta/hamburguesa-de-platano",
    desc: "Dos patacones crocantes, carne de res a la parrilla, queso, tomate y cebolla.",
  },
  {
    id: 14,
    name: "La Compinche",
    category: "Picadas",
    price: 58000,
    img: "https://stock.adobe.com/es/search?k=picada+colombiana&asset_id=513841842",
    desc: "Chorizo, morcilla, chicharrón, papa criolla, arepa y patacones.",
  },
  {
    id: 15,
    name: "La Parrandera",
    category: "Picadas",
    price: 58000,
    img: "https://stock.adobe.com/es/search?k=picada+colombiana&asset_id=1813372896",
    desc: "Carne de res, pollo, chorizo, chicharrón, morcilla, papa criolla, yuca frita y patacones.",
  },
  {
    id: 16,
    name: "La Campesina",
    category: "Picadas",
    price: 58000,
    img: "https://stock.adobe.com/es/search?k=picada+colombiana&asset_id=433829729",
    desc: "Chicharrón, chorizo, arepa, papa criolla, yuca frita y suero costeño.",
  },
  {
    id: 17,
    name: "La Corraleja",
    category: "Picadas",
    price: 58000,
    img: "https://es.pinterest.com/pin/817614507392122596/",
    desc: "Costilla de cerdo, chorizo, chicharrón, plátano maduro, papa criolla y guacamole.",
  },
  {
    id: 18,
    name: "La Fondera",
    category: "Picadas",
    price: 58000,
    img: "https://es.pinterest.com/pin/848717492321681995/",
    desc: "Carne de res, chicharrón, arepa, patacón y ensalada fresca.",
  },
  {
    id: 19,
    name: "La Tropilla",
    category: "Picadas",
    price: 58000,
    img: "https://es.pinterest.com/pin/983403268658882229/",
    desc: "Carne de res, pollo, chorizo, morcilla, chicharrón, papa criolla, patacones y yuca frita.",
  },
  {
    id: 20,
    name: "La Clásica",
    category: "Salchipapas",
    price: 12000,
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
    desc: "Papas fritas, salchicha, queso fundido y salsas de la casa (rosada, tomate, mostaza).",
  },
  {
    id: 21,
    name: "La Cargada",
    category: "Salchipapas",
    price: 16000,
    img: "https://www.infobae.com/colombia/2024/11/25/aprenda-a-preparar-el-mejor-salchipapa-de-colombia-salchipapa-costeno-en-una-sencilla-receta/",
    desc: "Papas fritas, salchicha, tocineta, queso fundido, maíz tierno y salsas.",
  },
  {
    id: 22,
    name: "La Ranchera",
    category: "Salchipapas",
    price: 15000,
    img: "https://lacocinalatina.club/recetas/salchipapas/",
    desc: "Papas fritas, salchicha, chorizo, cebolla caramelizada, queso fundido y salsa picante.",
  },
  {
    id: 23,
    name: "La Tropical",
    category: "Salchipapas",
    price: 17000,
    img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
    desc: "Papas fritas, salchicha, piña asada, queso fundido y salsa de la casa.",
  },
  {
    id: 24,
    name: "La Completa",
    category: "Salchipapas",
    price: 19000,
    img: "https://recetaselite.com/salchipapa/",
    desc: "Papas fritas, salchicha, carne desmechada, tocineta, queso fundido, huevo frito y maíz.",
  },
  {
    id: 25,
    name: "La Criolla",
    category: "Salchipapas",
    price: 15000,
    img: "https://bonviveur.com/es/recetas/salchipapas",
    desc: "Papas fritas, salchicha, papa criolla, queso fundido y hogao.",
  },
  {
    id: 26,
    name: "Coca-Cola",
    category: "Bebidas",
    price: 5000,
    img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 27,
    name: "Coca-Cola Zero",
    category: "Bebidas",
    price: 5000,
    img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 28,
    name: "Sprite",
    category: "Bebidas",
    price: 5000,
    img: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 29,
    name: "Colombiana",
    category: "Bebidas",
    price: 5000,
    img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 30,
    name: "Soda de Frutos Rojos",
    category: "Bebidas",
    price: 6000,
    img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 31,
    name: "Agua Cristal Sin Gas",
    category: "Bebidas",
    price: 4000,
    img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 32,
    name: "Agua Cristal Con Gas",
    category: "Bebidas",
    price: 4500,
    img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80",
    desc: "",
  },
  {
    id: 33,
    name: "Jugo Natural de Mora",
    category: "Bebidas",
    price: 8500,
    img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
    desc: "Mora fresca licuada con un toque de panela, preparada al momento.",
  },
  {
    id: 34,
    name: "Jugo Natural de fresa",
    category: "Bebidas",
    price: 8500,
    img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
    desc: "Fresa recién licuada, refrescante y ligeramente dulce.",
  },
  {
    id: 35,
    name: "Jugo Natural de Maracuyá",
    category: "Bebidas",
    price: 9000,
    img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
    desc: "Maracuyá fresco, dulce y ácido, preparado al instante.",
  },
  {
    id: 36,
    name: "Limonada Natural",
    category: "Bebidas",
    price: 8000,
    img: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9f?auto=format&fit=crop&w=900&q=80",
    desc: "Limón fresco recién exprimido, endulzado al gusto.",
  },
  {
    id: 37,
    name: "Jugo Natural de Mango",
    category: "Bebidas",
    price: 8500,
    img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80",
    desc: "Mango maduro licuado, cremoso y dulce, preparado al momento.",
  },
  {
    id: 38,
    name: "Extra Queso Derretido",
    category: "Toppings",
    price: 4000,
    img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=900&q=80",
    desc: "Porción adicional de queso fundido bien derretido.",
  },
  {
    id: 39,
    name: "Adición de Papas",
    category: "Toppings",
    price: 6000,
    img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
    desc: "Porción extra de papas fritas crocantes.",
  },
  {
    id: 40,
    name: "Extra Carne para Hamburguesa",
    category: "Toppings",
    price: 8000,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    desc: "Carne adicional de res, 100% Angus, a la parrilla.",
  },
  {
    id: 41,
    name: "Jalapeños",
    category: "Toppings",
    price: 3000,
    img: "https://images.unsplash.com/photo-1583224964978-2257b960c592?auto=format&fit=crop&w=900&q=80",
    desc: "Porción de jalapeños picantes en rodajas.",
  },
  {
    id: 42,
    name: "Queso Rallado",
    category: "Toppings",
    price: 3500,
    img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=900&q=80",
    desc: "Porción de queso rallado para espolvorear.",
  },
  {
    id: 43,
    name: "Salsa de Ajo",
    category: "Toppings",
    price: 2000,
    img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=80",
    desc: "Salsa cremosa de ajo, preparada en casa.",
  },
  {
    id: 44,
    name: "Salsa de Tomate",
    category: "Toppings",
    price: 1500,
    img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=80",
    desc: "Salsa de tomate clásica.",
  },
  {
    id: 45,
    name: "Salsa de Maíz Dulce",
    category: "Toppings",
    price: 2500,
    img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=80",
    desc: "Salsa cremosa preparada con maíz dulce.",
  },
  {
    id: 46,
    name: "Adición de Maíz Tierno",
    category: "Toppings",
    price: 3000,
    img: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80",
    desc: "Porción extra de maíz tierno.",
  },
  {
    id: 47,
    name: "Adición de carne  desmechada",
    category: "Toppings",
    price: 9000,
    img: "assets/img/hamburguesa-la_arrepentida.jpg",
    desc: "Porción adicional de carne desmechada jugosita.",
  },

  {
    id: 48,
    name: "Cebolla Caramelizada",
    category: "Toppings",
    price: 3500,
    img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=900&q=80",
    desc: "Porción de cebolla caramelizada, dulce y suave.",
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
