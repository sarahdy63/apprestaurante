// Importa el pool de conexiones configurado para MySQL.
const pool = require("../config/db");
// Consulta los productos activos del menú.
async function list(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Lee la categoría opcional enviada como query string.
    const category = req.query.category;
    // Prepara una consulta base que también trae el nombre de la categoría.
    let sql = "SELECT p.id, p.name, c.name AS category, p.price, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1";
    // Prepara el arreglo de parámetros para evitar concatenar valores del usuario.
    const params = [];
    // Agrega el filtro de categoría cuando fue solicitado.
    if (category && category !== "Todos") { sql += " AND c.name = ?"; params.push(category); }
    // Ordena de forma estable por categoría y nombre.
    sql += " ORDER BY c.name, p.name";
    // Ejecuta la consulta parametrizada.
    const [rows] = await pool.query(sql, params);
    // Devuelve el arreglo de productos en formato JSON.
    return res.json(rows);
  // Captura errores de consulta.
  } catch (error) {
    // Delega el manejo del error.
    return next(error);
  }
}
// Consulta todos los productos, incluso inactivos, para el administrador.
async function listAdmin(req, res, next) {
  // Inicia el bloque de manejo de errores.
  try {
    // Ejecuta la consulta administrativa.
    const [rows] = await pool.query("SELECT p.id, p.name, c.name AS category, p.price, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC");
    // Devuelve los productos encontrados.
    return res.json(rows);
  // Captura errores inesperados.
  } catch (error) {
    // Delega el error al middleware general.
    return next(error);
  }
}
// Obtiene el identificador de una categoría y la crea si no existe.
async function resolveCategory(connection, category) {
  // Busca la categoría por su nombre.
  const [rows] = await connection.query("SELECT id FROM categories WHERE name = ? LIMIT 1", [category]);
  // Devuelve el identificador cuando ya existe.
  if (rows.length) return rows[0].id;
  // Inserta una nueva categoría cuando el nombre todavía no existe.
  const [result] = await connection.query("INSERT INTO categories (name, active) VALUES (?, 1)", [category]);
  // Devuelve el identificador generado por MySQL.
  return result.insertId;
}
// Crea un nuevo producto del menú.
async function create(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Extrae los campos recibidos desde el frontend.
    const { name, category, price, img, desc } = req.body;
    // Valida los datos mínimos requeridos.
    if (!name || !category || price === undefined) return res.status(400).json({ message: "Nombre, categoría y precio son obligatorios." });
    // Obtiene una conexión dedicada para crear categoría y producto de forma consistente.
    const connection = await pool.getConnection();
    // Inicia un bloque para garantizar la liberación de la conexión.
    try {
      // Obtiene o crea la categoría solicitada.
      const categoryId = await resolveCategory(connection, category);
      // Inserta el nuevo producto con valores parametrizados.
      const [result] = await connection.query("INSERT INTO products (category_id, name, description, price, image_url, active) VALUES (?, ?, ?, ?, ?, 1)", [categoryId, name.trim(), desc || "", Number(price), img || "assets/img/product-placeholder.jpg"]);
      // Responde 201 indicando que el recurso fue creado.
      return res.status(201).json({ id: result.insertId, message: "Producto creado correctamente." });
    // Este bloque siempre se ejecuta aunque ocurra un error.
    } finally {
      // Devuelve la conexión al pool.
      connection.release();
    }
  // Captura errores de validación o base de datos.
  } catch (error) {
    // Delega el error al manejador global.
    return next(error);
  }
}
// Actualiza un producto existente.
async function update(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Lee el id desde la URL.
    const id = Number(req.params.id);
    // Extrae los campos editables enviados en el body.
    const { name, category, price, img, desc, active = 1 } = req.body;
    // Valida los campos obligatorios.
    if (!id || !name || !category || price === undefined) return res.status(400).json({ message: "Datos incompletos para actualizar el producto." });
    // Solicita una conexión dedicada.
    const connection = await pool.getConnection();
    // Garantiza que la conexión sea liberada al terminar.
    try {
      // Obtiene el id de la categoría seleccionada.
      const categoryId = await resolveCategory(connection, category);
      // Ejecuta la actualización del producto.
      const [result] = await connection.query("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, active = ? WHERE id = ?", [categoryId, name.trim(), desc || "", Number(price), img || "", active ? 1 : 0, id]);
      // Devuelve 404 si el id no existe.
      if (!result.affectedRows) return res.status(404).json({ message: "Producto no encontrado." });
      // Confirma la actualización.
      return res.json({ message: "Producto actualizado correctamente." });
    // Se ejecuta al salir del bloque interno.
    } finally {
      // Devuelve la conexión al pool.
      connection.release();
    }
  // Captura errores inesperados.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Realiza un borrado lógico para conservar referencias históricas de ventas.
async function remove(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Convierte el id de la URL a número.
    const id = Number(req.params.id);
    // Marca el producto como inactivo en lugar de borrarlo físicamente.
    const [result] = await pool.query("UPDATE products SET active = 0 WHERE id = ?", [id]);
    // Devuelve 404 cuando el producto no existe.
    if (!result.affectedRows) return res.status(404).json({ message: "Producto no encontrado." });
    // Confirma la eliminación lógica.
    return res.json({ message: "Producto eliminado del menú." });
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Exporta las operaciones para asociarlas con rutas HTTP.
module.exports = { list, listAdmin, create, update, remove };
