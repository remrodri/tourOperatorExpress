import { NextFunction, Request, Response } from "express";
import { IUserManagementService } from "../service/IUserManagementService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class UserManagementController {
  private readonly userManagementService: IUserManagementService;

  constructor(userManagementService: IUserManagementService) {
    this.userManagementService = userManagementService;
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userManagementService.getAllUsers();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Usuarios encontrados satisfactoriamente")
        .setData(users)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
        .setMessage("Error al obtener usuarios")
        .build();
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      return next(error);
    }
  }
}
