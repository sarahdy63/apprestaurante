const pool = require("../config/db");
async function get(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM restaurant_info WHERE id = 1",
    );
    return res.json(rows[0] || {});
  } catch (error) {
    return next(error);
  }
}
async function update(req, res, next) {
  try {
    const {
      name,
      description,
      phone,
      email,
      city,
      address,
      scheduleWeek,
      scheduleWeekend,
    } = req.body;
    await pool.query(
      "UPDATE restaurant_info SET name=?, description=?, phone=?, email=?, city=?, address=?, schedule_week=?, schedule_weekend=? WHERE id=1",
      [
        name,
        description,
        phone,
        email,
        city,
        address,
        scheduleWeek,
        scheduleWeekend,
      ],
    );
    return res.json({ message: "Información del restaurante actualizada." });
  } catch (error) {
    return next(error);
  }
}
module.exports = { get, update };
