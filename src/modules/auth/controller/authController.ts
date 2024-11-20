import { Request, Response, NextFunction } from "express";
import { AuthService } from "../service/authService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // const loginData = req.body;
      // console.log("req.body::: ", loginData);
      const token = await this.authService.login(req.body);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Usuario logeado satisfactoriamiente")
        .setData({ token })
        .build();
      res.status(StatusCodes.OK).json(response);
      // console.log('response::: ', response);
    } catch (error) {
      next(error);
    }
  };
}
