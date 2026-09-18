// Importa la conexión compartida a MySQL.
const pool = require("../config/db");
// Obtiene la información pública del restaurante.
async function get(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Consulta el único registro de configuración de esta versión.
    const [rows] = await pool.query("SELECT * FROM restaurant_info WHERE id = 1");
    // Devuelve el registro encontrado o un objeto vacío.
    return res.json(rows[0] || {});
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Actualiza la información institucional del restaurante.
async function update(req, res, next) {
  // Inicia el manejo de errores.
  try {
    // Extrae todos los campos editables.
    const { name, description, phone, email, city, address, scheduleWeek, scheduleWeekend } = req.body;
    // Actualiza el registro principal.
    await pool.query("UPDATE restaurant_info SET name=?, description=?, phone=?, email=?, city=?, address=?, schedule_week=?, schedule_weekend=? WHERE id=1", [name, description, phone, email, city, address, scheduleWeek, scheduleWeekend]);
    // Confirma la actualización.
    return res.json({ message: "Información del restaurante actualizada." });
  // Captura errores.
  } catch (error) {
    // Delega el error.
    return next(error);
  }
}
// Exporta las operaciones disponibles.
module.exports = { get, update };
