const pool = require("../config/db");

async function list(req, res, next) {
  try {
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

module.exports = { list };
