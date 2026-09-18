// Importa bcryptjs para comparar contraseñas contra su hash almacenado.
const bcrypt = require("bcryptjs");
// Importa jsonwebtoken para crear el token de sesión del administrador.
const jwt = require("jsonwebtoken");
// Importa el pool de conexiones a MySQL.
const pool = require("../config/db");
// Atiende el inicio de sesión del administrador.
async function login(req, res, next) {
  // Inicia un bloque protegido para centralizar errores inesperados.
  try {
    // Obtiene correo y contraseña enviados en el cuerpo JSON.
    const { email, password } = req.body;
    // Valida que los dos datos obligatorios hayan sido enviados.
    if (!email || !password) return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    // Busca un usuario administrador activo por correo electrónico.
    const [rows] = await pool.query("SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND active = 1 LIMIT 1", [email]);
    // Obtiene el primer usuario encontrado.
    const user = rows[0];
    // Compara la contraseña recibida con el hash de base de datos.
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    // Rechaza el acceso cuando las credenciales no coinciden.
    if (!valid) return res.status(401).json({ message: "Credenciales inválidas." });
    // Firma un JWT con la identidad y rol del administrador.
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
    // Retorna token y datos básicos que necesita el frontend.
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  // Captura cualquier error de base de datos o programación.
  } catch (error) {
    // Entrega el error al middleware general de Express.
    return next(error);
  }
}
// Exporta las funciones públicas del controlador.
module.exports = { login };
