// Importa bcryptjs para almacenar la contraseña de forma segura usando hash.
const bcrypt = require("bcryptjs");
// Importa el pool de conexiones a MySQL.
const pool = require("../config/db");
// Define una función asíncrona que garantiza la existencia del administrador inicial.
async function seedAdmin() {
  // Lee el correo inicial desde .env o utiliza el valor de demostración.
  const email = process.env.ADMIN_EMAIL || "admin@gastro.com";
  // Lee la contraseña inicial desde .env o utiliza el valor de demostración.
  const password = process.env.ADMIN_PASSWORD || "123456";
  // Consulta si ya existe un usuario con ese correo.
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  // Termina sin cambios si el administrador ya existe.
  if (rows.length) return;
  // Genera un hash irreversible de la contraseña con un costo de 10 rondas.
  const passwordHash = await bcrypt.hash(password, 10);
  // Inserta el administrador inicial en la tabla users.
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, 'ADMIN', 1)",
    ["Administrador Gastro", email, passwordHash],
  );
  // Informa por consola que el usuario inicial fue creado.
  console.log(`Administrador inicial creado: ${email}`);
}
// Exporta la función para ejecutarla al iniciar el servidor.
module.exports = seedAdmin;
