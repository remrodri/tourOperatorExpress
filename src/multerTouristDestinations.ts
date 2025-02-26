import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Configuración de multer con destino dinámico
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    // Generamos un ID único para la carpeta si no se ha definido antes
    if (!req.body.imageFolder) {
      req.body.imageFolder = uuidv4();
    }

    const destinationPath = path.join(
      __dirname,
      "../uploads/destinations",
      req.body.imageFolder
    );

    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

// Middleware de subida
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

export default upload;
