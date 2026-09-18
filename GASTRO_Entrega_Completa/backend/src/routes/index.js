// Importa Express para construir el router principal.
const express = require("express");
// Importa el middleware de autenticación JWT.
const requireAuth = require("../middleware/auth");
// Importa el controlador de autenticación.
const auth = require("../controllers/authController");
// Importa el controlador de productos.
const products = require("../controllers/productController");
// Importa el controlador de pedidos.
const orders = require("../controllers/orderController");
// Importa el controlador de información del restaurante.
const restaurant = require("../controllers/restaurantController");
// Crea una instancia de router de Express.
const router = express.Router();
// Expone un endpoint simple para comprobar que la API está activa.
router.get("/health", (req, res) => res.json({ status: "ok", service: "gastro-api" }));
// Expone el inicio de sesión del administrador.
router.post("/auth/login", auth.login);
// Expone el catálogo público de productos activos.
router.get("/products", products.list);
// Expone la creación pública de pedidos desde el carrito.
router.post("/orders", orders.create);
// Expone el seguimiento público de un pedido mediante su código.
router.get("/orders/code/:code", orders.getByCode);
// Expone la información pública del restaurante.
router.get("/restaurant", restaurant.get);
// Protege la lista administrativa de productos con JWT.
router.get("/admin/products", requireAuth, products.listAdmin);
// Protege la creación de productos con JWT.
router.post("/admin/products", requireAuth, products.create);
// Protege la edición de productos con JWT.
router.put("/admin/products/:id", requireAuth, products.update);
// Protege la eliminación lógica de productos con JWT.
router.delete("/admin/products/:id", requireAuth, products.remove);
// Protege la consulta de pedidos administrativos con JWT.
router.get("/admin/orders", requireAuth, orders.list);
// Protege el cambio de estado de pedidos con JWT.
router.patch("/admin/orders/:id/status", requireAuth, orders.updateStatus);
// Protege los indicadores de ventas del panel administrativo.
router.get("/admin/dashboard/summary", requireAuth, orders.summary);
// Protege la actualización de la información institucional.
router.put("/admin/restaurant", requireAuth, restaurant.update);
// Exporta el router para montarlo en /api.
module.exports = router;
