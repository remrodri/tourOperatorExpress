import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import apiRouter from "./modules/apiRouter";
import { errorMiddleware } from "./middleware/errorMiddleware";
import path from "path";
// import swaggerUi from "swagger-ui-express";
// import swaggerDocument from "./swagger.json"; // Generado con Swagger

dotenv.config();

const app: Application = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", apiRouter);
// Documentación con Swagger
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas (Ejemplo de rutas de usuario)
// import userRoutes from "./routes/UserRoutes";
// app.use("/api/users", userRoutes);

app.use(errorMiddleware);

// Manejo de errores global
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: "Ocurrió un error en el servidor.",
//     details: err.message,
//   });
// });


export default app;
