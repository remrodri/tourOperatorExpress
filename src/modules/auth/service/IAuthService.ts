import { loginResponseDto } from "../dto/loginResponseDto";

export interface IAuthService{
  // login(email: string, password: string): Promise<{ user: loginResponseDto, token: string }>;
  login(loginData:{email: string, password: string}):Promise<any>;
}