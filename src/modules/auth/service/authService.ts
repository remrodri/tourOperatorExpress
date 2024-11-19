import { z } from "zod";
import { LoginRequestDto } from "../dto/loginRequestDto";
import { loginResponseDto } from "../dto/loginResponseDto";
import { IAuthService } from "./IAuthService";
import { IAuthRepository } from "../repository/IAuthRepository";

export class AuthService implements IAuthService {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  async login(loginData: { email: string; password: string }): Promise<any> {
    // console.log("loginData::: ", loginData);
    try {
      const validData = LoginRequestDto.parse(loginData);
      if (validData) {
        this.authRepository.findByEmail(loginData.email);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Errores de validacion: ", error.errors);
      }
    }
  }
  // login(email: string, password: string): Promise<{ user: loginResponseDto; token: string; }> {
}
