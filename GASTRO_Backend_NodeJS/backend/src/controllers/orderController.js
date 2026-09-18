// Importa el pool de MySQL.
const pool = require("../config/db");
// Define el costo fijo de domicilio usado por esta versión básica.
const SHIPPING_FEE = 6000;
// Crea un código público legible para identificar el pedido.
function createCode() {
  // Combina la hora actual con un número aleatorio y conserva cinco dígitos.
  return `GD-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 10)}`;
}
// Registra un pedido enviado por un cliente.
async function create(req, res, next) {
  // Solicita una conexión exclusiva porque se usará una transacción.
  const connection = await pool.getConnection();
  // Inicia un bloque que permite hacer rollback ante cualquier fallo.
  try {
    // Extrae los datos del cliente y los productos solicitados.
    const { customer, items, paymentMethod = "Pago contra entrega" } = req.body;
    // Valida que exista un cliente y al menos un producto.
    if (!customer || !Array.isArray(items) || !items.length) return res.status(400).json({ message: "El pedido debe incluir cliente y productos." });
    // Verifica que cada cantidad sea un entero positivo antes de calcular valores.
    if (items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0)) return res.status(400).json({ message: "Las cantidades deben ser enteros mayores que cero." });
    // Extrae todos los identificadores de producto recibidos.
    const ids = items.map((item) => Number(item.productId));
    // Crea los signos ? necesarios para una consulta IN segura.
    const placeholders = ids.map(() => "?").join(",");
    // Consulta en MySQL precios reales para no confiar en los precios del navegador.
    const [products] = await connection.query(`SELECT id, name, price FROM products WHERE active = 1 AND id IN (${placeholders})`, ids);
    // Rechaza el pedido si algún id no corresponde a un producto activo.
    if (products.length !== new Set(ids).size) return res.status(400).json({ message: "Uno o más productos no existen o están inactivos." });
    // Crea un mapa para encontrar rápidamente cada producto por su id.
    const productMap = new Map(products.map((product) => [product.id, product]));
    // Calcula el subtotal usando exclusivamente los precios obtenidos de MySQL.
    const subtotal = items.reduce((sum, item) => sum + productMap.get(Number(item.productId)).price * Number(item.quantity), 0);
    // Define el costo de domicilio para pedidos con valor positivo.
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    // Calcula el total final que quedará persistido.
    const total = subtotal + shipping;
    // Genera el código visible del pedido.
    const code = createCode();
    // Inicia la transacción de base de datos.
    await connection.beginTransaction();
    // Inserta la cabecera del pedido.
    const [orderResult] = await connection.query("INSERT INTO orders (code, customer_first_name, customer_last_name, phone, neighborhood, address, payment_method, subtotal, shipping_fee, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECIBIDO')", [code, customer.firstName, customer.lastName, customer.phone, customer.neighborhood, customer.address, paymentMethod, subtotal, shipping, total]);
    // Recorre cada producto para registrar su detalle y una copia histórica del precio/nombre.
    for (const item of items) {
      // Busca la información real del producto.
      const product = productMap.get(Number(item.productId));
      // Convierte la cantidad a número.
      const quantity = Number(item.quantity);
      // Inserta el detalle asociado al pedido.
      await connection.query("INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)", [orderResult.insertId, product.id, product.name, product.price, quantity, product.price * quantity]);
    }
    // Confirma todos los INSERT de la transacción.
    await connection.commit();
    // Devuelve el pedido recién creado al frontend.
    return res.status(201).json({ id: orderResult.insertId, code, subtotal, shippingFee: shipping, total, status: "RECIBIDO" });
  // Captura cualquier fallo durante la operación.
  } catch (error) {
    // Revierte cualquier cambio parcial de la transacción.
    await connection.rollback();
    // Delega el error al middleware global.
    return next(error);
  // Siempre se ejecuta al terminar.
  } finally {
    // Devuelve la conexión al pool.
    connection.release();
  }
}
// Busca un pedido público por su código.
async function getByCode(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Consulta la cabecera usando el código de la URL.
    const [orders] = await pool.query("SELECT * FROM orders WHERE code = ? LIMIT 1", [req.params.code]);
    // Obtiene el primer resultado.
    const order = orders[0];
    // Devuelve 404 si no hay coincidencias.
    if (!order) return res.status(404).json({ message: "Pedido no encontrado." });
    // Consulta los productos asociados a ese pedido.
    const [items] = await pool.query("SELECT product_id AS productId, product_name AS name, unit_price AS unitPrice, quantity, line_total AS lineTotal FROM order_items WHERE order_id = ?", [order.id]);
    // Devuelve cabecera y detalle en una sola respuesta.
    return res.json({ ...order, items });
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Lista pedidos para el panel administrativo.
async function list(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Consulta pedidos recientes y concatena los productos de cada pedido.
    const [rows] = await pool.query("SELECT o.id, o.code, CONCAT(o.customer_first_name, ' ', o.customer_last_name) AS customer, o.phone, o.neighborhood, o.address, o.total, o.status, o.created_at, GROUP_CONCAT(CONCAT(oi.quantity, ' x ', oi.product_name) SEPARATOR ', ') AS products FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200");
    // Devuelve la lista al administrador.
    return res.json(rows);
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Cambia el estado operativo de un pedido.
async function updateStatus(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Define los estados permitidos por el flujo del prototipo.
    const allowed = ["RECIBIDO", "PREPARANDO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];
    // Obtiene el nuevo estado del body.
    const status = req.body.status;
    // Rechaza valores diferentes a los definidos.
    if (!allowed.includes(status)) return res.status(400).json({ message: "Estado no válido." });
    // Actualiza el pedido indicado por id.
    const [result] = await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, Number(req.params.id)]);
    // Devuelve 404 cuando el pedido no existe.
    if (!result.affectedRows) return res.status(404).json({ message: "Pedido no encontrado." });
    // Confirma el cambio al frontend.
    return res.json({ message: "Estado actualizado correctamente." });
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Calcula indicadores básicos de ventas para el panel.
async function summary(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Calcula total de pedidos y ventas del día actual.
    const [daily] = await pool.query("SELECT COUNT(*) AS ordersToday, COALESCE(SUM(CASE WHEN status <> 'CANCELADO' THEN total ELSE 0 END), 0) AS salesToday FROM orders WHERE DATE(created_at) = CURDATE()");
    // Cuenta pedidos por preparar.
    const [pending] = await pool.query("SELECT COUNT(*) AS pending FROM orders WHERE status IN ('RECIBIDO','PREPARANDO')");
    // Cuenta pedidos que se encuentran en camino.
    const [routes] = await pool.query("SELECT COUNT(*) AS routes FROM orders WHERE status = 'EN_CAMINO'");
    // Devuelve los cuatro indicadores requeridos por el dashboard.
    return res.json({ ...daily[0], pending: pending[0].pending, routes: routes[0].routes });
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Exporta las funciones del controlador.
module.exports = { create, getByCode, list, updateStatus, summary };
