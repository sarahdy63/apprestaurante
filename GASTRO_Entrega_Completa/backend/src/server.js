// Importa Express, el framework HTTP usado por el backend.
const express = require("express");
// Importa CORS para permitir peticiones desde el frontend ejecutado en otro puerto.
const cors = require("cors");
// Carga las variables de entorno desde el archivo .env.
require("dotenv").config();
// Importa el pool para probar la conexión con MySQL al arrancar.
const pool = require("./config/db");
// Importa las rutas REST de la aplicación.
const routes = require("./routes");
// Importa la utilidad que crea el administrador inicial cuando hace falta.
const seedAdmin = require("./utils/seedAdmin");
// Crea la aplicación Express.
const app = express();
// Convierte la lista de orígenes permitidos del .env en un arreglo.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://127.0.0.1:5500,http://localhost:5500").split(",");
// Habilita CORS y valida el origen del navegador.
app.use(cors({ origin: (origin, callback) => (!origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error("Origen no permitido por CORS"))) }));
// Habilita la lectura de cuerpos JSON y limita su tamaño por seguridad básica.
app.use(express.json({ limit: "1mb" }));
// Monta todas las rutas funcionales debajo del prefijo /api.
app.use("/api", routes);
// Atiende rutas inexistentes con una respuesta JSON uniforme.
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada." }));
// Centraliza errores no controlados sin exponer detalles internos al cliente.
app.use((error, req, res, next) => {
  // Registra el error completo en la consola del servidor para diagnóstico.
  console.error(error);
  // Devuelve una respuesta genérica de error interno.
  res.status(500).json({ message: "Ocurrió un error interno en el servidor." });
});
// Convierte el puerto configurado a número y usa 3000 por defecto.
const port = Number(process.env.PORT || 3000);
// Define una función asíncrona para iniciar la aplicación de forma segura.
async function start() {
  // Ejecuta una consulta mínima para validar conexión y credenciales de MySQL.
  await pool.query("SELECT 1");
  // Crea el administrador inicial si todavía no existe.
  await seedAdmin();
  // Inicia el servidor HTTP una vez la base de datos está disponible.
  app.listen(port, () => console.log(`GASTRO API disponible en http://localhost:${port}/api`));
}
// Ejecuta el arranque y captura fallos críticos de configuración.
start().catch((error) => {
  // Muestra el fallo de arranque en consola.
  console.error("No fue posible iniciar la API:", error.message);
  // Finaliza el proceso con código de error para facilitar diagnóstico.
  process.exit(1);
});
