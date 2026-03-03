import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

import apiRouter from "./modules/apiRouter";
import { errorMiddleware } from "./middleware/errorMiddleware";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

/* =========================
   Middlewares base
========================= */

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* =========================
   Headers para Dev Tunnels (HTTP/2 fix)
========================= */
app.use((req, res, next) => {
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* =========================
   Static files (uploads)
   ✅ usar process.cwd()
========================= */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* =========================
   API routes
========================= */
app.use("/api", apiRouter);

/* =========================
   Error handler
========================= */
app.use(errorMiddleware);

export default app;
