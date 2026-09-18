// Importa mysql2 con soporte de Promises para poder usar async/await.
const mysql = require("mysql2/promise");
// Importa dotenv para leer las variables definidas en el archivo .env.
require("dotenv").config();
// Crea un pool de conexiones reutilizables hacia MySQL.
const pool = mysql.createPool({
  // Define el servidor donde está MySQL.
  host: process.env.DB_HOST,
  // Convierte el puerto configurado a un número.
  port: Number(process.env.DB_PORT || 3306),
  // Define el usuario con el que se abrirán las conexiones.
  user: process.env.DB_USER,
  // Define la contraseña del usuario de MySQL.
  password: process.env.DB_PASSWORD,
  // Selecciona la base de datos de la aplicación.
  database: process.env.DB_NAME,
  // Espera una conexión libre si todas están ocupadas.
  waitForConnections: true,
  // Limita el número máximo de conexiones simultáneas.
  connectionLimit: 10,
  // Permite una cola ilimitada de solicitudes en espera.
  queueLimit: 0,
  // Hace que los DECIMAL lleguen como Number, útil para precios y totales.
  decimalNumbers: true,
});
// Exporta el pool para usarlo desde controladores y utilidades.
module.exports = pool;
