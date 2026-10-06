// Importa bcryptjs para comparar contraseñas contra su hash almacenado.
const bcrypt = require("bcryptjs");
// Importa jsonwebtoken para crear el token de sesión del administrador.
const jwt = require("jsonwebtoken");
// Importa el pool de conexiones a MySQL.
const pool = require("../config/db");
// Atiende el inicio de sesión del administrador.
const crypto = require("crypto");
const { enviarCorreo } = require("../utils/mailService");

async function login(req, res, next) {
  // Inicia un bloque protegido para centralizar errores inesperados.
  try {
    // Obtiene correo y contraseña enviados en el cuerpo JSON.
    const { email, password } = req.body;
    // Valida que los dos datos obligatorios hayan sido enviados.
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Correo y contraseña son obligatorios." });
    // Busca un usuario administrador activo por correo electrónico.
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    // Obtiene el primer usuario encontrado.
    const user = rows[0];
    // Compara la contraseña recibida con el hash de base de datos.
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    // Rechaza el acceso cuando las credenciales no coinciden.
    if (!valid)
      return res.status(401).json({ message: "Credenciales inválidas." });
    // Firma un JWT con la identidad y rol del administrador.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );
    // Retorna token y datos básicos que necesita el frontend.
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    // Captura cualquier error de base de datos o programación.
  } catch (error) {
    // Entrega el error al middleware general de Express.
    return next(error);
  }
}
async function recuperarContrasenia(req, res, next) {
  try {
    const { email } = req.body; // 1. Recibe el correo que escribió el admin.
    if (!email)
      return res.status(400).json({ message: "El correo es obligatorio." });

    const [rows] = await pool.query(
      // 2. Busca ese correo en la tabla users.
      "SELECT id, email FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = rows[0];

    const mensaje = "Si el correo está registrado, te enviamos un código.";
    if (!user)
      return res.status(404).json({
        message: "Ese correo no está registrado. Revisa que esté bien escrito.",
      });

    const codigo = String(crypto.randomInt(100000, 1000000)); // 4. Genera un código de 6 números.
    const codeHash = await bcrypt.hash(codigo, 10); // 5. Lo protege con bcrypt antes de guardarlo.

    await pool.query(
      // 6. Anula los códigos anteriores de este usuario.
      "UPDATE codes SET used = 1 WHERE user_id = ? AND used = 0",
      [user.id],
    );

    await pool.query(
      // 7. Guarda el nuevo código en la tabla codes (vence en 15 minutos).
      "INSERT INTO codes (user_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))",
      [user.id, codeHash],
    );

    await enviarCorreo({
      // 8. Envía el código al correo del admin.
      para: user.email,
      asunto: "Código de recuperación de contraseña",
      plantilla: "recuperacion_password",
      parametros: { codigo },
    });

    // 9. Responde al frontend.
    return res.json({ message: mensaje });
  } catch (error) {
    return next(error);
  }
}
async function cambiarContrasenia(req, res, next) {
  try {
    // 1. Recibe correo, código y contraseña nueva.
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

    // 2. Busca al usuario por su correo.
    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = users[0];
    if (!user) return res.status(400).json({ message: mensajeError });

    // 3. Trae el código más reciente de ese usuario que no esté usado ni vencido.
    const [codes] = await pool.query(
      "SELECT id, code_hash FROM codes WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );
    const registro = codes[0];
    if (!registro) return res.status(400).json({ message: mensajeError });

    // 4. Compara el código que escribió con el que está protegido en la base de datos.
    const valido = await bcrypt.compare(String(codigo), registro.code_hash);
    if (!valido) return res.status(400).json({ message: mensajeError });

    // 5. Protege la contraseña nueva y la guarda.
    const nuevoHash = await bcrypt.hash(nuevaContrasenia, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      nuevoHash,
      user.id,
    ]);

    // 6. Marca el código como usado para que no sirva otra vez.
    await pool.query("UPDATE codes SET used = 1 WHERE id = ?", [registro.id]);

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    return next(error);
  }
}
async function verificarCodigo(req, res, next) {
  try {
    // 1. Recibe el correo y el código que escribió la persona.
    const { email, codigo } = req.body;
    if (!email || !codigo)
      return res
        .status(400)
        .json({ message: "Correo y código son obligatorios." });

    const mensajeError = "Código inválido o vencido.";

    // 2. Busca al usuario por su correo.
    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND active = 1 LIMIT 1",
      [email],
    );
    const user = users[0];
    if (!user) return res.status(400).json({ message: mensajeError });

    // 3. Trae el código más reciente que no esté usado ni vencido.
    const [codes] = await pool.query(
      "SELECT code_hash FROM codes WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id],
    );
    const registro = codes[0];
    if (!registro) return res.status(400).json({ message: mensajeError });

    // 4. Compara el código escrito con el guardado.
    const valido = await bcrypt.compare(String(codigo), registro.code_hash);
    if (!valido) return res.status(400).json({ message: mensajeError });

    // 5. Todo bien: solo avisa. No cambia nada ni marca el código como usado.
    return res.json({ message: "Código correcto." });
  } catch (error) {
    return next(error);
  }
}
// Exporta las funciones públicas del controlador.
module.exports = {
  login,
  recuperarContrasenia,
  cambiarContrasenia,
  verificarCodigo,
};
