import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { IRoleService } from "../service/IRoleService";

export class RoleController {
  private readonly roleService: IRoleService;

  constructor(roleService: IRoleService) {
    this.roleService = roleService;
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    // console.log('req.body::: ', req.body);
  }
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await this.roleService.getAllRoles();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Roles encontrados satisfactoriamente")
        .setData(roles)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
        .setMessage("Error al obtener los roles")
        .build();
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      return next(error);
    }
  }
}
