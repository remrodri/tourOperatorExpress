import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { CreateUserDto } from "../dto/createUserDto";
import { IUserService } from "../service/IUserService";
import { UpdateUserDto } from "../dto/updateUserDto";
import { DeleteUserDto } from "../dto/deleteUserDto";

export class UserController {
  private readonly userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async softDeleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const deleteUserDto = DeleteUserDto.parse(req.body);
      // console.log("userId::: ", userId);
      const userDeleted = await this.userService.softDeleteUser(deleteUserDto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Usuario eliminado exitosamente")
        .setData(userDeleted)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
        .setMessage("Error al eliminar el usuario")
        .build();
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      next(error);
    }
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
      // const response = new ApiResponseBuilder()
      //   .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
      //   .setMessage("Error al obtener usuarios")
      //   .build();
      // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      next(error);
    }
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log("req::: ", req.body);
    // console.log(req.file);
    try {
      const createUserDto = CreateUserDto.parse(req.body);
      const imagePath = req.file?.path || null;
      if (!imagePath) {
        throw new Error("Falla al subir la imagen");
      }
      const image = imagePath
        ? `/uploads/perfilImage/${req.file?.filename}`
        : null;
      const userDataWithImage = { ...createUserDto, image };
      // console.log("userDataWithImage::: ", userDataWithImage);
      const user = await this.userService.createUser(userDataWithImage);
      // console.log('user-controller::: ', user);
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

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const updateUserDto = UpdateUserDto.parse(req.body);
    console.log('updateUserDto::: ', updateUserDto);
    try {
      const user = await this.userService.updateUser(updateUserDto, req.params.userId);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(user)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
