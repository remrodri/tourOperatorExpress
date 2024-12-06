import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { CreateUserDto } from "../dto/createUserDto";
import { IUserService } from "../service/IUserService";

export class UserController {
  private readonly userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.getAllUsers();
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

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log('req::: ', req.body);
    const createUserDto = CreateUserDto.parse(req.body);
    // console.log("createUserDto::: ", createUserDto);
    try {
      const user = await this.userService.createUser(createUserDto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.CREATED)
        .setMessage("Usuario creado satisfactoriamente")
        .setData(user)
        .build();
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }
}
