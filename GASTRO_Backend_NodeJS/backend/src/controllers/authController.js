const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const crypto = require("crypto");
const { enviarCorreo } = require("../utils/mailService");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Correo y contraseña son obligatorios." });
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = rows[0];
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!valid)
      return res.status(401).json({ message: "Credenciales inválidas." });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}
async function recuperarContrasenia(req, res, next) {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "El correo es obligatorio." });

    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = rows[0];

    const mensaje = "Si el correo está registrado, te enviamos un código.";
    if (!user)
      return res.status(404).json({
        message: "Ese correo no está registrado. Revisa que esté bien escrito.",
      });

    const codigo = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(codigo, 10);

    await pool.query(
      "UPDATE codes SET used = 1 WHERE user_id = ? AND used = 0",
      [user.id],
    );

    await pool.query(
      "INSERT INTO codes (user_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))",
      [user.id, codeHash],
    );

    await enviarCorreo({
      para: user.email,
      asunto: "Código de recuperación de contraseña",
      plantilla: "recuperacion_password",
      parametros: { codigo },
    });

    return res.json({ message: mensaje });
  } catch (error) {
    return next(error);
  }
}
async function cambiarContrasenia(req, res, next) {
  try {
    const { email, codigo, nuevaContrasenia } = req.body;
    if (!email || !codigo || !nuevaContrasenia)
      return res.status(400).json({
        message: "Correo, código y contraseña nueva son obligatorios.",
      });

    if (nuevaContrasenia.length < 8)
      return res
        .status(400)
        .json({ message: "La contraseña debe tener mínimo 8 caracteres." });

    const mensajeError = "Código inválido o vencido.";

    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = users[0];
    if (!user) return res.status(400).json({ message: mensajeError });

    const [codes] = await pool.query(
      "SELECT id, code_hash FROM codes WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );
    const registro = codes[0];
    if (!registro) return res.status(400).json({ message: mensajeError });

    const valido = await bcrypt.compare(String(codigo), registro.code_hash);
    if (!valido) return res.status(400).json({ message: mensajeError });

    const nuevoHash = await bcrypt.hash(nuevaContrasenia, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      nuevoHash,
      user.id,
    ]);

    await pool.query("UPDATE codes SET used = 1 WHERE id = ?", [registro.id]);

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    return next(error);
  }
}
async function verificarCodigo(req, res, next) {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo)
      return res
        .status(400)
        .json({ message: "Correo y código son obligatorios." });

    const mensajeError = "Código inválido o vencido.";

    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = users[0];
    if (!user) return res.status(400).json({ message: mensajeError });

    const [codes] = await pool.query(
      "SELECT code_hash FROM codes WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );
    const registro = codes[0];
    if (!registro) return res.status(400).json({ message: mensajeError });

    const valido = await bcrypt.compare(String(codigo), registro.code_hash);
    if (!valido) return res.status(400).json({ message: mensajeError });

    return res.json({ message: "Código correcto." });
  } catch (error) {
    return next(error);
  }
}
module.exports = {
  login,
  recuperarContrasenia,
  cambiarContrasenia,
  verificarCodigo,
};
