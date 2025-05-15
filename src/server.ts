import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedQuestions } from "./database/seedQuestions";
import { seedRoles } from "./database/seedRoles";
import { seedUsers } from "./database/seedUsers";
import { seedUserQuestionsAnswers } from "./database/seedUserQuestionsAnswers";

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT ?? 5000;
// const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/tourism";

const MONGO_URI =
  process.env.MONGO_URI ?? "mongodb://localhost:27017/tourism?replicaSet=rs0";

// Función para manejar la conexión con MongoDB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("Conectado a MongoDB");
//   } catch (error) {
//     console.error("Error conectando a MongoDB:", error);
//     process.exit(1); // Detener el servidor si no se puede conectar a la BD
//   }
// };

// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGO_URI, {
//       // These options might help with transactions
//       retryWrites: true,
//       w: "majority",
//     });
//     console.log("Conectado a MongoDB");
//   } catch (error) {
//     console.error("Error conectando a MongoDB:", error);
//     process.exit(1);
//   }
// };

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      retryWrites: true,
      w: "majority",
    });
    console.log("Conectado a MongoDB Replica Set");

    // Ejecutar el sembrado de datos después de la conexión exitosa
    // await seedQuestions();
    // await seedRoles();
    // await seedUsers();
    // await seedUserQuestionsAnswers();
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
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
