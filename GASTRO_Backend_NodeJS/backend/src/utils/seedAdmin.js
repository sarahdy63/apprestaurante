const bcrypt = require("bcryptjs");
const pool = require("../config/db");
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@gastro.com";
  const password = process.env.ADMIN_PASSWORD || "123456";
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  if (rows.length) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, 'ADMIN', 1)",
    ["Administrador Gastro", email, passwordHash],
  );
  console.log(`Administrador inicial creado: ${email}`);
}
module.exports = seedAdmin;
