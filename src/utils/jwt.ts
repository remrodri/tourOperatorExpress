import jwt from "jsonwebtoken";
import { token } from "morgan";
import { UserRequestDto } from "../modules/auth/dto/userRequestDto";
import { UserResponseDto } from "../modules/auth/dto/userResponseDto";

const JWT_SECRET = process.env.JWT_SECRET || "MiSecretKey";

export const generateToken = (user: UserResponseDto) => {
  // return jwt.sign({ userId, email, }, JWT_SECRET, { expiresIn: "720h" });
  return jwt.sign(user, JWT_SECRET, { expiresIn: "720h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
