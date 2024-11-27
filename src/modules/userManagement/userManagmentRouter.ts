import { Router } from "express";
import { UserManagementRepository } from "./repository/UserManagementRepository";
import { UserManamentService } from "./service/UserManagementService";
import { UserManagementController } from "./controller/UserManagementController";
import { authMiddleware } from "../../middleware/authMiddleware";

const userManagementRouter: Router = Router();
const userManagementRepository = new UserManagementRepository();
const userManagementService = new UserManamentService(userManagementRepository);
const userManagementController = new UserManagementController(
  userManagementService
);

userManagementRouter.get("/users", authMiddleware,(req, res, next) =>
  userManagementController.getAllUsers(req, res, next)
);
export default userManagementRouter;
