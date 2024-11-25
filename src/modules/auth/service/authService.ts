import { z } from "zod";
import { LoginRequestDto } from "../dto/loginRequestDto";
import { loginResponseDto } from "../dto/loginResponseDto";
import { IAuthService } from "./IAuthService";
import { IAuthRepository } from "../repository/IAuthRepository";
import { HttpException } from "../../../middleware/httpException";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../utils/jwt";

export class AuthService implements IAuthService {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async login(loginData: { email: string; password: string }): Promise<any> {
    // console.log("loginData::: ", loginData);
    try {
      const validData = LoginRequestDto.parse(loginData);
      if (!validData) {
        throw new HttpException(
          StatusCodes.UNAUTHORIZED,
          "Credenciales Invalidas"
        );
      }
      const user = await this.authRepository.findByEmail(loginData.email);
      if (!user) {
        throw new HttpException(
          StatusCodes.UNAUTHORIZED,
          "Credenciales Invalidas"
        );
      }
      if (user.deleted) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, "Cuenta Eliminada");
      }
      const isValidPassword = await bcrypt.compare(
        loginData.password,
        user.password
      );
      if (!isValidPassword) {
        throw new HttpException(
          StatusCodes.UNAUTHORIZED,
          "Credenciales Invalidas"
        );
      }
      // console.log("user::: ", user);
      const userDto: loginResponseDto = {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        firstLogin: user.firstLogin,
        role: user.role.toString(),
        ci: user.ci,
      };
      // console.log('userDto::: ', userDto);
      const token = generateToken(userDto);
      return token;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Errores de validacion: ", error.errors);
      }
    }
  }
  // login(email: string, password: string): Promise<{ user: loginResponseDto; token: string; }> {
}
