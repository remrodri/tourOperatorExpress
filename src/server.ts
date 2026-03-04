import app from "./app";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedQuestions } from "./database/seedQuestions";
import { seedRoles } from "./database/seedRoles";
import { seedUsers } from "./database/seedUsers";
import { seedUserQuestionsAnswers } from "./database/seedUserQuestionsAnswers";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Acepta ambos nombres por si acaso
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/tourism";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      retryWrites: true,
      w: "majority",
    });
    console.log("Conectado a MongoDB Replica Set");

    if (process.env.RUN_SEEDS === "true") {
      console.log("Ejecutando seeds iniciales...");
      await seedQuestions();
      await seedRoles();
      await seedUsers();
      await seedUserQuestionsAnswers();
      console.log("Seeds ejecutados correctamente");
    }
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

const initialize = async () => {
  await connectDB();
  startServer();
};

initialize();
