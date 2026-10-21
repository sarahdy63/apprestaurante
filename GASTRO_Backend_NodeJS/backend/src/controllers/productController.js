const pool = require("../config/db");

function imagePathFromRequest(req) {
  if (!req.file) return null;
  return `assets/img/productos/${req.file.filename}`;
}

async function list(req, res, next) {
  try {
    const category = req.query.category;
    let sql =
      "SELECT p.id, p.name, c.name AS category, p.price, p.stock, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1";
    const params = [];
    if (category && category !== "Todos") {
      sql += " AND c.name = ?";
      params.push(category);
    }
    sql += " ORDER BY c.name, p.name";
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function listAdmin(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT p.id, p.name, c.name AS category, p.price, p.stock, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC",
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function resolveCategory(connection, category) {
  const [rows] = await connection.query(
    "SELECT id FROM categories WHERE name = ? LIMIT 1",
    [category],
  );
  if (rows.length) return rows[0].id;
  const [result] = await connection.query(
    "INSERT INTO categories (name, active) VALUES (?, 1)",
    [category],
  );
  return result.insertId;
}

async function create(req, res, next) {
  try {
    const { name, category, price, desc, stock = 0 } = req.body;
    const imagePath = imagePathFromRequest(req);
    if (!name || !category || price === undefined)
      return res
        .status(400)
        .json({ message: "Nombre, categoría y precio son obligatorios." });
    if (!imagePath)
      return res
        .status(400)
        .json({ message: "Selecciona una imagen para el nuevo producto." });
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0)
      return res.status(400).json({ message: "El precio no es válido." });
    const numericStock = Number(stock);
    if (!Number.isInteger(numericStock) || numericStock < 0)
      return res.status(400).json({
        message: "El stock debe ser un número entero, cero o mayor.",
      });
    const connection = await pool.getConnection();
    try {
      const categoryId = await resolveCategory(connection, category);
      const [result] = await connection.query(
        "INSERT INTO products (category_id, name, description, price, stock, image_url, active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [
          categoryId,
          name.trim(),
          desc || "",
          numericPrice,
          numericStock,
          imagePath,
        ],
      );
      return res.status(201).json({
        id: result.insertId,
        image: imagePath,
        message: "Producto creado correctamente.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, category, price, desc, active = 1 } = req.body;
    if (!id || !name || !category || price === undefined)
      return res
        .status(400)
        .json({ message: "Datos incompletos para actualizar el producto." });
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0)
      return res.status(400).json({ message: "El precio no es válido." });
    const connection = await pool.getConnection();
    try {
      const [currentRows] = await connection.query(
        "SELECT image_url FROM products WHERE id = ? LIMIT 1",
        [id],
      );
      if (!currentRows.length)
        return res.status(404).json({ message: "Producto no encontrado." });
      const imagePath =
        imagePathFromRequest(req) || currentRows[0].image_url || "";
      const categoryId = await resolveCategory(connection, category);
      const activeValue =
        String(active) === "0" || String(active) === "false" ? 0 : 1;
      const [result] = await connection.query(
        "UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, active = ? WHERE id = ?",
        [
          categoryId,
          name.trim(),
          desc || "",
          numericPrice,
          imagePath,
          activeValue,
          id,
        ],
      );
      if (!result.affectedRows)
        return res.status(404).json({ message: "Producto no encontrado." });
      return res.json({
        image: imagePath,
        message: "Producto actualizado correctamente.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query(
      "UPDATE products SET active = 0 WHERE id = ?",
      [id],
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Producto no encontrado." });
    return res.json({ message: "Producto eliminado del menú." });
  } catch (error) {
    return next(error);
  }
}

async function updateStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { add, set } = req.body;
    let sql, qty;
    if (add !== undefined) {
      qty = Number(add);
      if (!Number.isInteger(qty) || qty <= 0)
        return res.status(400).json({
          message:
            "La cantidad a sumar debe ser un número entero mayor que cero.",
        });
      sql = "UPDATE products SET stock = stock + ? WHERE id = ?";
    } else if (set !== undefined) {
      qty = Number(set);
      if (!Number.isInteger(qty) || qty < 0)
        return res.status(400).json({
          message: "El stock debe ser un número entero, cero o mayor.",
        });
      sql = "UPDATE products SET stock = ? WHERE id = ?";
    } else {
      return res
        .status(400)
        .json({ message: "Envía 'add' (sumar) o 'set' (fijar)." });
    }
    const [result] = await pool.query(sql, [qty, id]);
    if (!result.affectedRows)
      return res.status(404).json({ message: "Producto no encontrado." });
    const [rows] = await pool.query("SELECT stock FROM products WHERE id = ?", [
      id,
    ]);
    return res.json({
      message: "Stock actualizado correctamente.",
      stock: rows[0].stock,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, listAdmin, create, update, remove, updateStock };
