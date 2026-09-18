// Importa la librería que valida y decodifica tokens JWT.
const jwt = require("jsonwebtoken");
// Define el middleware que protege las rutas exclusivas del administrador.
function requireAuth(req, res, next) {
  // Lee el encabezado Authorization enviado por el navegador.
  const header = req.headers.authorization || "";
  // Extrae el token cuando el encabezado utiliza el formato Bearer <token>.
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  // Verifica que realmente se haya recibido un token.
  if (!token) {
    // Devuelve 401 porque la petición no está autenticada.
    return res.status(401).json({ message: "Token de autenticación requerido." });
  }
  // Intenta validar la firma y vigencia del token.
  try {
    // Guarda los datos decodificados del usuario dentro de la petición.
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // Continúa hacia el controlador solicitado.
    return next();
  // Captura tokens inválidos, manipulados o vencidos.
  } catch (error) {
    // Devuelve 401 para impedir el acceso a la ruta protegida.
    return res.status(401).json({ message: "Token inválido o vencido." });
  }
}
// Expone el middleware para importarlo en las rutas.
module.exports = requireAuth;
