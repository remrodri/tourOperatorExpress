import { NextFunction, Request, Response } from "express";
import { HttpException } from "./httpException";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpException(
      StatusCodes.UNAUTHORIZED,
      "No se encontro el token de autenticacion"
    );
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new HttpException(StatusCodes.UNAUTHORIZED, "Token invalido");
  }
};
