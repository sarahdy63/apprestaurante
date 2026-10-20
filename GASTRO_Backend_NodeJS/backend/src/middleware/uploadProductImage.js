// Importa Multer para procesar formularios multipart/form-data con archivos.
const multer = require("multer");
// Importa Path para construir rutas compatibles con Windows, Linux y macOS.
const path = require("path");
// Importa FS para crear la carpeta de imágenes cuando todavía no existe.
const fs = require("fs");

// Calcula la carpeta física donde el backend guardará las imágenes del frontend.
// PRODUCT_IMAGES_DIR permite cambiar la ubicación en otro ambiente sin modificar código.
const uploadDirectory = process.env.PRODUCT_IMAGES_DIR
  ? path.resolve(process.env.PRODUCT_IMAGES_DIR)
  : path.resolve(
      __dirname,
      "../../../../GASTRO_Frontend/frontend/assets/img/productos",
    );

// Crea la carpeta de productos y sus carpetas padre si todavía no existen.
fs.mkdirSync(uploadDirectory, { recursive: true });

// Configura almacenamiento físico en disco para las imágenes de productos.
const storage = multer.diskStorage({
  // Indica a Multer la carpeta donde debe escribir cada archivo recibido.
  destination: (req, file, callback) => {
    // Devuelve la carpeta calculada sin reportar error.
    callback(null, uploadDirectory);
  },
  // Genera un nombre único para evitar que dos imágenes se sobrescriban.
  filename: (req, file, callback) => {
    // Obtiene la extensión original en minúsculas.
    const originalExtension = path.extname(file.originalname).toLowerCase();
    // Define una extensión segura cuando el archivo no trae una reconocible.
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    // Usa la extensión original si existe; de lo contrario usa la correspondiente al MIME.
    const extension = originalExtension || extensionByMime[file.mimetype] || ".jpg";
    // Limpia el nombre original para conservar una parte legible del archivo.
    const baseName = path
      .basename(file.originalname, originalExtension)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "producto";
    // Combina nombre, fecha y un número aleatorio para garantizar unicidad práctica.
    const uniqueName = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    // Entrega a Multer el nombre definitivo del archivo.
    callback(null, uniqueName);
  },
});

// Valida que el archivo recibido realmente sea una imagen admitida por la aplicación.
function fileFilter(req, file, callback) {
  // Lista de tipos MIME permitidos para imágenes de productos.
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  // Acepta el archivo cuando su tipo MIME se encuentra en la lista.
  if (allowedMimeTypes.includes(file.mimetype)) return callback(null, true);
  // Rechaza cualquier otro tipo de archivo con un mensaje entendible.
  return callback(
    new Error("Solo se permiten imágenes JPG, JPEG, PNG o WEBP."),
  );
}

// Crea la instancia de Multer con almacenamiento, validación y límite de 5 MB.
const uploader = multer({
  // Usa el almacenamiento en disco definido arriba.
  storage,
  // Usa el filtro de tipos de archivo definido arriba.
  fileFilter,
  // Limita cada archivo a cinco megabytes.
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Expone un middleware específico para recibir un único archivo llamado "image".
function uploadProductImage(req, res, next) {
  // Ejecuta Multer para un solo archivo del campo image.
  uploader.single("image")(req, res, (error) => {
    // Continúa normalmente cuando no ocurrió ningún error de carga.
    if (!error) return next();
    // Devuelve un mensaje específico cuando el archivo supera los 5 MB.
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "La imagen no puede superar los 5 MB." });
    }
    // Devuelve como error de validación cualquier otro problema de Multer o del filtro.
    return res.status(400).json({
      message: error.message || "No fue posible cargar la imagen del producto.",
    });
  });
}

// Exporta el middleware para utilizarlo en las rutas administrativas de productos.
module.exports = uploadProductImage;
