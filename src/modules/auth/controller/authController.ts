import { Request, Response, NextFunction } from "express";
import { AuthService } from "../service/authService";

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
      const response = this.authService.login(req.body)
    } catch (error) {
      next(error);
    }
  };
}
