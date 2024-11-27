import { z } from "zod";
import { UserRequestDto } from "../dto/userRequestDto";
import { UserResponseDto } from "../dto/userResponseDto";
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
    const validData = UserRequestDto.parse(loginData);
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
    const userDto: UserResponseDto = {
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
  }
  // login(email: string, password: string): Promise<{ user: UserResponseDto; token: string; }> {
}
