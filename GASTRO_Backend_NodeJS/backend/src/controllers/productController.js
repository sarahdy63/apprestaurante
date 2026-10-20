// Importa el pool de conexiones configurado para MySQL.
const pool = require("../config/db");

// Convierte el archivo recibido por Multer en la ruta relativa que usa el frontend.
function imagePathFromRequest(req) {
  // Devuelve null cuando la petición no incluye una nueva imagen.
  if (!req.file) return null;
  // Guarda solamente una ruta relativa portable y no una ruta física del computador.
  return `assets/img/productos/${req.file.filename}`;
}

// Consulta los productos activos del menú.
async function list(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Lee la categoría opcional enviada como query string.
    const category = req.query.category;
    // Prepara una consulta base que también trae el nombre de la categoría.
    let sql =
      "SELECT p.id, p.name, c.name AS category, p.price, p.stock, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1";
    // Prepara el arreglo de parámetros para evitar concatenar valores del usuario.
    const params = [];
    // Agrega el filtro de categoría cuando fue solicitado.
    if (category && category !== "Todos") {
      // Agrega la condición parametrizada a la consulta.
      sql += " AND c.name = ?";
      // Agrega el valor de categoría a los parámetros.
      params.push(category);
    }
    // Ordena de forma estable por categoría y nombre.
    sql += " ORDER BY c.name, p.name";
    // Ejecuta la consulta parametrizada.
    const [rows] = await pool.query(sql, params);
    // Devuelve el arreglo de productos en formato JSON.
    return res.json(rows);
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
    const [rows] = await pool.query(
      "SELECT p.id, p.name, c.name AS category, p.price, p.stock, p.image_url AS img, p.description AS `desc`, p.active FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC",
    );
    // Devuelve los productos encontrados.
    return res.json(rows);
  } catch (error) {
    // Delega el error al middleware general.
    return next(error);
  }
}

// Obtiene el identificador de una categoría y la crea si no existe.
async function resolveCategory(connection, category) {
  // Busca la categoría por su nombre.
  const [rows] = await connection.query(
    "SELECT id FROM categories WHERE name = ? LIMIT 1",
    [category],
  );
  // Devuelve el identificador cuando ya existe.
  if (rows.length) return rows[0].id;
  // Inserta una nueva categoría cuando el nombre todavía no existe.
  const [result] = await connection.query(
    "INSERT INTO categories (name, active) VALUES (?, 1)",
    [category],
  );
  // Devuelve el identificador generado por MySQL.
  return result.insertId;
}

// Crea un nuevo producto del menú.
async function create(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Extrae los campos de texto procesados por Multer desde multipart/form-data.
    const { name, category, price, desc, stock = 0 } = req.body;
    // Obtiene la ruta relativa de la imagen que Multer guardó en el frontend.
    const imagePath = imagePathFromRequest(req);
    // Valida los datos mínimos requeridos.
    if (!name || !category || price === undefined)
      return res
        .status(400)
        .json({ message: "Nombre, categoría y precio son obligatorios." });
    // Exige una imagen para los productos nuevos.
    if (!imagePath)
      return res
        .status(400)
        .json({ message: "Selecciona una imagen para el nuevo producto." });
    // Convierte y valida el precio recibido.
    const numericPrice = Number(price);
    // Rechaza precios inválidos o negativos.
    if (!Number.isFinite(numericPrice) || numericPrice < 0)
      return res.status(400).json({ message: "El precio no es válido." });
    // Convierte y valida el stock inicial.
    const numericStock = Number(stock);
    // Rechaza stock negativo o no entero.
    if (!Number.isInteger(numericStock) || numericStock < 0)
      return res.status(400).json({
        message: "El stock debe ser un número entero, cero o mayor.",
      });
    // Obtiene una conexión dedicada para crear categoría y producto de forma consistente.
    const connection = await pool.getConnection();
    // Inicia un bloque para garantizar la liberación de la conexión.
    try {
      // Obtiene o crea la categoría solicitada.
      const categoryId = await resolveCategory(connection, category);
      // Inserta el nuevo producto con valores parametrizados.
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
      // Responde 201 indicando que el recurso fue creado y devuelve la ruta guardada.
      return res.status(201).json({
        id: result.insertId,
        image: imagePath,
        message: "Producto creado correctamente.",
      });
    } finally {
      // Devuelve la conexión al pool.
      connection.release();
    }
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
    // Extrae los campos editables enviados como multipart/form-data.
    const { name, category, price, desc, active = 1 } = req.body;
    // Valida los campos obligatorios.
    if (!id || !name || !category || price === undefined)
      return res
        .status(400)
        .json({ message: "Datos incompletos para actualizar el producto." });
    // Convierte el precio a número.
    const numericPrice = Number(price);
    // Rechaza precios inválidos o negativos.
    if (!Number.isFinite(numericPrice) || numericPrice < 0)
      return res.status(400).json({ message: "El precio no es válido." });
    // Solicita una conexión dedicada.
    const connection = await pool.getConnection();
    // Garantiza que la conexión sea liberada al terminar.
    try {
      // Consulta la imagen actual para conservarla cuando no se cargue una nueva.
      const [currentRows] = await connection.query(
        "SELECT image_url FROM products WHERE id = ? LIMIT 1",
        [id],
      );
      // Devuelve 404 si el producto no existe.
      if (!currentRows.length)
        return res.status(404).json({ message: "Producto no encontrado." });
      // Usa la nueva imagen si llegó un archivo; en caso contrario conserva la actual.
      const imagePath = imagePathFromRequest(req) || currentRows[0].image_url || "";
      // Obtiene el id de la categoría seleccionada.
      const categoryId = await resolveCategory(connection, category);
      // Convierte active correctamente aunque llegue como texto desde FormData.
      const activeValue = String(active) === "0" || String(active) === "false" ? 0 : 1;
      // Ejecuta la actualización del producto.
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
      // Devuelve 404 si el id no existe por una condición concurrente inesperada.
      if (!result.affectedRows)
        return res.status(404).json({ message: "Producto no encontrado." });
      // Confirma la actualización y devuelve la ruta de imagen vigente.
      return res.json({
        image: imagePath,
        message: "Producto actualizado correctamente.",
      });
    } finally {
      // Devuelve la conexión al pool.
      connection.release();
    }
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
    const [result] = await pool.query(
      "UPDATE products SET active = 0 WHERE id = ?",
      [id],
    );
    // Devuelve 404 cuando el producto no existe.
    if (!result.affectedRows)
      return res.status(404).json({ message: "Producto no encontrado." });
    // Confirma la eliminación lógica.
    return res.json({ message: "Producto eliminado del menú." });
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}

// Suma stock cuando llega mercancía, o lo fija cuando el admin cuenta lo que hay.
async function updateStock(req, res, next) {
  // Inicia el manejo controlado de errores.
  try {
    // Lee el id del producto desde la URL.
    const id = Number(req.params.id);
    // Lee del body si se quiere sumar (add) o fijar (set) la cantidad.
    const { add, set } = req.body;
    // Aquí se guardará la consulta y la cantidad según el caso.
    let sql, qty;
    // Entra cuando la petición quiere sumar existencias.
    if (add !== undefined) {
      // Convierte a número la cantidad a sumar.
      qty = Number(add);
      // Valida que sea un entero mayor que cero.
      if (!Number.isInteger(qty) || qty <= 0)
        return res.status(400).json({
          message:
            "La cantidad a sumar debe ser un número entero mayor que cero.",
        });
      // Prepara la consulta que suma sobre el stock actual.
      sql = "UPDATE products SET stock = stock + ? WHERE id = ?";
    } else if (set !== undefined) {
      // Convierte a número el valor absoluto de stock.
      qty = Number(set);
      // Valida que sea un entero cero o mayor.
      if (!Number.isInteger(qty) || qty < 0)
        return res.status(400).json({
          message: "El stock debe ser un número entero, cero o mayor.",
        });
      // Prepara la consulta que reemplaza el stock actual.
      sql = "UPDATE products SET stock = ? WHERE id = ?";
    } else {
      // Rechaza la petición cuando no trae ninguna operación de stock.
      return res
        .status(400)
        .json({ message: "Envía 'add' (sumar) o 'set' (fijar)." });
    }
    // Ejecuta la actualización.
    const [result] = await pool.query(sql, [qty, id]);
    // Si no se modificó nada, el producto no existe.
    if (!result.affectedRows)
      return res.status(404).json({ message: "Producto no encontrado." });
    // Consulta el stock actual para devolverlo.
    const [rows] = await pool.query("SELECT stock FROM products WHERE id = ?", [
      id,
    ]);
    // Devuelve confirmación y cantidad vigente.
    return res.json({
      message: "Stock actualizado correctamente.",
      stock: rows[0].stock,
    });
  } catch (error) {
    // Delega el error al manejador general.
    return next(error);
  }
}

// Exporta las operaciones para asociarlas con rutas HTTP.
module.exports = { list, listAdmin, create, update, remove, updateStock };
