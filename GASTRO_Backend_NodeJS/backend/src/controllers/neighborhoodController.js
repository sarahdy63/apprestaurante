// Importa el pool de MySQL.
const pool = require("../config/db");

// Lista los barrios con cobertura, con su zona y el valor del domicilio.
// El frontend la usa para llenar la lista "Barrio" del formulario de pedido.
async function list(req, res, next) {
  try {
    // Une cada barrio con su zona para traer la tarifa en una sola consulta.
    const [rows] = await pool.query(
      "SELECT n.id, n.name, z.name AS zone, z.shipping_fee AS shippingFee " +
        "FROM neighborhoods n JOIN delivery_zones z ON z.id = n.zone_id " +
        "WHERE n.active = 1 ORDER BY z.id, n.name",
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

// Exporta las funciones del controlador.
module.exports = { list };