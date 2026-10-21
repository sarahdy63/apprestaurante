const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = process.env.PRODUCT_IMAGES_DIR
  ? path.resolve(process.env.PRODUCT_IMAGES_DIR)
  : path.resolve(
      __dirname,
      "../../../../GASTRO_Frontend/frontend/assets/img/productos",
    );

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const originalExtension = path.extname(file.originalname).toLowerCase();
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const extension =
      originalExtension || extensionByMime[file.mimetype] || ".jpg";
    const baseName =
      path
        .basename(file.originalname, originalExtension)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "producto";
    const uniqueName = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

function fileFilter(req, file, callback) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) return callback(null, true);
  return callback(
    new Error("Solo se permiten imágenes JPG, JPEG, PNG o WEBP."),
  );
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function uploadProductImage(req, res, next) {
  uploader.single("image")(req, res, (error) => {
    if (!error) return next();
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({ message: "La imagen no puede superar los 5 MB." });
    }
    return res.status(400).json({
      message: error.message || "No fue posible cargar la imagen del producto.",
    });
  });
}

module.exports = uploadProductImage;
