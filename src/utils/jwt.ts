import jwt from "jsonwebtoken";
import { token } from "morgan";
import { LoginRequestDto } from "../modules/auth/dto/loginRequestDto";
import { loginResponseDto } from "../modules/auth/dto/loginResponseDto";

const JWT_SECRET = process.env.JWT_SECRET || "MiSecretKey";

export const generateToken = (user:loginResponseDto) => {
  // return jwt.sign({ userId, email, }, JWT_SECRET, { expiresIn: "720h" });
  return jwt.sign(user, JWT_SECRET, { expiresIn: "720h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
