import { Router } from "express";
import { RoleController } from "../controller/roleController";
import { RoleRepository } from "../repository/RoleRepository";
import { RoleService } from "../service/RoleService";

const roleRouter: Router = Router();

const roleRepository = new RoleRepository();
const roleService = new RoleService(roleRepository);
const roleController = new RoleController(roleService);

roleRouter.get("/roles", (req, res, next) =>
  roleController.getAllRoles(req, res, next)
);

export default roleRouter;
