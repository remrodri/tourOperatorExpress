import multer, { StorageEngine } from "multer";
import path from "path";
import { Request } from "express";

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null, path.join(__dirname, "../../uploads/perfilImage")); // Ruta consistente
    cb(null, path.join(__dirname, "../uploads/perfilImage")); // Ruta consistente
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files (JPEG, PNG, WEBP) are allowed!"));
  }

  // Validar también por extensión de archivo
  const allowedExtensions = [".jpeg", ".jpg", ".png", ".webp"];
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error("File extension not allowed!"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter,
});

export default upload;
