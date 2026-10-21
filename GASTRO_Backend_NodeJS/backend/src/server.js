const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");
const routes = require("./routes");
const seedAdmin = require("./utils/seedAdmin");
const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://127.0.0.1:5500,http://localhost:5500"
).split(",");
app.use(
  cors({
    origin: (origin, callback) =>
      !origin || allowedOrigins.includes(origin)
        ? callback(null, true)
        : callback(new Error("Origen no permitido por CORS")),
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada." }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Ocurrió un error interno en el servidor." });
});
const port = Number(process.env.PORT || 3000);
async function start() {
  await pool.query("SELECT 1");
  await seedAdmin();
  app.listen(port, () =>
    console.log(`GASTRO API disponible en http://localhost:${port}/api`),
  );
}
start().catch((error) => {
  console.error("No fue posible iniciar la API:", error.message);
  process.exit(1);
});
