import { Router } from "express";
import { AuthController } from "./controller/authController";
import { AuthService } from "./service/authService";
import { AuthRepository } from "./repository/authRepository";

const authRouter: Router = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post("/auth/login", (req, res, next) =>
  authController.login(req, res, next)
);

export default authRouter;
