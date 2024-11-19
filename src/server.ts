import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/tourism";

// Función para manejar la conexión con MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1); // Detener el servidor si no se puede conectar a la BD
  }
};

// Iniciar el servidor
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

// Llamar a las funciones de conexión a DB e iniciar el servidor
const initialize = async () => {
  await connectDB();
  startServer();
};

initialize();
