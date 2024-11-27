import { UserResponseDto } from "../dto/userResponseDto";

export interface IAuthService {
  // login(email: string, password: string): Promise<{ user: UserResponseDto, token: string }>;
  login(loginData: { email: string; password: string }): Promise<any>;
}
