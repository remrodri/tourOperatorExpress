
import multer from "multer";

// Usar memory storage - mantiene el archivo en memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export default upload;