const express = require("express");
const requireAuth = require("../middleware/auth");
const uploadProductImage = require("../middleware/uploadProductImage");
const auth = require("../controllers/authController");
const products = require("../controllers/productController");
const orders = require("../controllers/orderController");
const restaurant = require("../controllers/restaurantController");
const neighborhoods = require("../controllers/neighborhoodController");
const router = express.Router();
router.get("/health", (req, res) =>
  res.json({ status: "ok", service: "gastro-api" }),
);
router.post("/auth/login", auth.login);
router.post("/auth/recuperarcontrasenia", auth.recuperarContrasenia);
router.patch("/auth/cambiarcontrasenia", auth.cambiarContrasenia);
router.post("/auth/verificarcodigo", auth.verificarCodigo);
router.get("/products", products.list);
router.get("/neighborhoods", neighborhoods.list);
router.get("/delivery-hours", orders.deliveryHours);
router.post("/orders", orders.create);
router.get("/orders/code/:code", orders.getByCode);
router.patch("/orders/code/:code/cancel", orders.cancelByCode);
router.get("/restaurant", restaurant.get);
router.get("/admin/products", requireAuth, products.listAdmin);
router.post(
  "/admin/products",
  requireAuth,
  uploadProductImage,
  products.create,
);
router.patch("/admin/products/:id/stock", requireAuth, products.updateStock);
router.put(
  "/admin/products/:id",
  requireAuth,
  uploadProductImage,
  products.update,
);
router.delete("/admin/products/:id", requireAuth, products.remove);
router.get("/admin/orders", requireAuth, orders.list);
router.patch("/admin/orders/:id/status", requireAuth, orders.updateStatus);
router.get("/admin/dashboard/summary", requireAuth, orders.summary);
router.put("/admin/restaurant", requireAuth, restaurant.update);

module.exports = router;
