const pool = require("../config/db");
const getDeliveryHours = require("../utils/deliveryHours");
const MIN_ORDER = 30000;
const NOTE_CATEGORIES = ["Hamburguesas", "Picadas", "Salchipapas"];
function createCode() {
  return `GD-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 10)}`;
}
async function create(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const hours = getDeliveryHours();
    if (!hours.open) return res.status(403).json({ message: hours.message });
    const { customer, items, paymentMethod = "Pago contra entrega" } = req.body;
    if (!customer || !Array.isArray(items) || !items.length)
      return res
        .status(400)
        .json({ message: "El pedido debe incluir cliente y productos." });
    if (
      items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0,
      )
    )
      return res.status(400).json({
        message: "Las cantidades deben ser enteros mayores que cero.",
      });
    const neighborhoodId = Number(customer.neighborhoodId);
    if (!Number.isInteger(neighborhoodId) || neighborhoodId <= 0)
      return res
        .status(400)
        .json({ message: "Selecciona un barrio de la lista." });
    const [barrios] = await connection.query(
      "SELECT n.id, n.name, z.shipping_fee FROM neighborhoods n JOIN delivery_zones z ON z.id = n.zone_id WHERE n.id = ? AND n.active = 1 LIMIT 1",
      [neighborhoodId],
    );
    if (!barrios.length)
      return res.status(400).json({
        message:
          "Lo sentimos, por ahora no tenemos cobertura de domicilio en ese barrio.",
      });
    const barrio = barrios[0];
    const ids = items.map((item) => Number(item.productId));
    const placeholders = ids.map(() => "?").join(",");
    const [products] = await connection.query(
      `SELECT p.id, p.name, p.price, p.stock, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1 AND p.id IN (${placeholders})`,
      ids,
    );
    if (products.length !== new Set(ids).size)
      return res
        .status(400)
        .json({ message: "Uno o más productos no existen o están inactivos." });
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        productMap.get(Number(item.productId)).price * Number(item.quantity),
      0,
    );

    if (subtotal < MIN_ORDER)
      return res.status(400).json({
        message: `El pedido mínimo para domicilio es de $${MIN_ORDER.toLocaleString("es-CO")}. Te faltan $${(MIN_ORDER - subtotal).toLocaleString("es-CO")}.`,
      });

    const shipping = Number(barrio.shipping_fee);
    const total = subtotal + shipping;
    const code = createCode();
    await connection.beginTransaction();
    const [orderResult] = await connection.query(
      "INSERT INTO orders (code, customer_first_name, customer_last_name, phone, neighborhood_id, neighborhood, address, payment_method, subtotal, shipping_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECIBIDO')",
      [
        code,
        customer.firstName,
        customer.lastName,
        customer.phone,
        barrio.id,
        barrio.name,
        customer.address,
        paymentMethod,
        subtotal,
        shipping,
        total,
      ],
    );
    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      const quantity = Number(item.quantity);
      const [stockResult] = await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [quantity, product.id, quantity],
      );
      if (stockResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({
          message: `Ups, lo sentimos no contamos con esa cantidad de "${product.name}" disponible en el local.`,
          productId: product.id,
          available: product.stock,
        });
      }
      const note = NOTE_CATEGORIES.includes(product.category)
        ? String(item.note || "")
            .trim()
            .slice(0, 150) || null
        : null;
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, note, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          orderResult.insertId,
          product.id,
          product.name,
          product.price,
          quantity,
          note,
          product.price * quantity,
        ],
      );
    }
    await connection.commit();
    return res.status(201).json({
      id: orderResult.insertId,
      code,
      subtotal,
      shippingFee: shipping,
      total,
      status: "RECIBIDO",
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}
async function getByCode(req, res, next) {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE code = ? LIMIT 1",
      [req.params.code],
    );
    const order = orders[0];
    if (!order)
      return res.status(404).json({ message: "Pedido no encontrado." });
    const [items] = await pool.query(
      "SELECT product_id AS productId, product_name AS name, unit_price AS unitPrice, quantity, note, line_total AS lineTotal FROM order_items WHERE order_id = ?",
      [order.id],
    );
    return res.json({ ...order, items });
  } catch (error) {
    return next(error);
  }
}
async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const conditions = [];
    const params = [];
    if (q) {
      conditions.push(
        "(o.code LIKE ? OR CONCAT(o.customer_first_name, ' ', o.customer_last_name) LIKE ? OR o.phone LIKE ?)",
      );
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    const allowedStatuses = [
      "RECIBIDO",
      "PREPARANDO",
      "EN_CAMINO",
      "ENTREGADO",
      "CANCELADO",
    ];
    const statuses = (req.query.status || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => allowedStatuses.includes(value));
    if (statuses.length) {
      conditions.push(`o.status IN (${statuses.map(() => "?").join(",")})`);
      params.push(...statuses);
    }
    const date = (req.query.date || "").trim();
    if (date) {
      conditions.push("DATE(o.created_at) = ?");
      params.push(date);
    }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.query(
      "SELECT o.id, o.code, CONCAT(o.customer_first_name, ' ', o.customer_last_name) AS customer, o.phone, o.neighborhood, o.address, o.total, o.status, o.created_at, GROUP_CONCAT(CONCAT(oi.quantity, ' x ', oi.product_name) SEPARATOR ', ') AS products, CAST(SUM(oi.quantity) AS UNSIGNED) AS itemsCount FROM orders o JOIN order_items oi ON oi.order_id = o.id " +
        where +
        " GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?",
      [...params, limit, offset],
    );
    const [countResult] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders o " + where,
      params,
    );

    return res.json({
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
      data: rows,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const allowed = [
      "RECIBIDO",
      "PREPARANDO",
      "EN_CAMINO",
      "ENTREGADO",
      "CANCELADO",
    ];
    const status = req.body.status;
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Estado no válido." });
    const id = Number(req.params.id);

    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    const previous = rows[0].status;
    if (
      status === "CANCELADO" &&
      previous !== "CANCELADO" &&
      !["RECIBIDO", "PREPARANDO"].includes(previous)
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: "Este pedido ya salió a entrega y no se puede cancelar.",
      });
    }
    if (previous === "CANCELADO" && status !== "CANCELADO") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Un pedido cancelado no se puede reactivar." });
    }

    await connection.query("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    if (status === "CANCELADO" && previous !== "CANCELADO") {
      const [items] = await connection.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [id],
      );
      for (const item of items) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id],
        );
      }
    }

    await connection.commit();
    return res.json({ message: "Estado actualizado correctamente." });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}
async function summary(req, res, next) {
  try {
    const [daily] = await pool.query(
      "SELECT COUNT(*) AS ordersToday, COALESCE(SUM(CASE WHEN status <> 'CANCELADO' THEN total ELSE 0 END), 0) AS salesToday FROM orders WHERE DATE(created_at) = CURDATE()",
    );
    const [statusCounts] = await pool.query(
      "SELECT " +
        "SUM(status = 'RECIBIDO') AS received, " +
        "SUM(status = 'PREPARANDO') AS preparing, " +
        "SUM(status = 'EN_CAMINO') AS routes, " +
        "SUM(status = 'ENTREGADO') AS delivered, " +
        "SUM(status = 'CANCELADO') AS cancelled " +
        "FROM orders",
    );
    const pending =
      Number(statusCounts[0].received || 0) +
      Number(statusCounts[0].preparing || 0);
    return res.json({
      ...daily[0],
      pending,
      received: Number(statusCounts[0].received || 0),
      preparing: Number(statusCounts[0].preparing || 0),
      routes: Number(statusCounts[0].routes || 0),
      delivered: Number(statusCounts[0].delivered || 0),
      cancelled: Number(statusCounts[0].cancelled || 0),
    });
  } catch (error) {
    return next(error);
  }
}
async function cancelByCode(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT id, status FROM orders WHERE code = ? FOR UPDATE",
      [req.params.code],
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    const order = rows[0];
    if (order.status === "CANCELADO") {
      await connection.rollback();
      return res.status(409).json({ message: "Este pedido ya fue cancelado." });
    }
    if (order.status !== "RECIBIDO") {
      await connection.rollback();
      return res.status(409).json({
        message:
          "Este pedido ya no se puede cancelar porque ya está en preparación o fue entregado.",
      });
    }
    await connection.query(
      "UPDATE orders SET status = 'CANCELADO' WHERE id = ?",
      [order.id],
    );
    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [order.id],
    );
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id],
      );
    }
    await connection.commit();
    return res.json({
      message: "Tu pedido fue cancelado correctamente.",
      status: "CANCELADO",
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}
function deliveryHours(req, res) {
  return res.json(getDeliveryHours());
}
module.exports = {
  deliveryHours,
  create,
  getByCode,
  list,
  updateStatus,
  summary,
  cancelByCode,
};
