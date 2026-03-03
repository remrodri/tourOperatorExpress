import { ZodError } from "zod";
import { HttpException } from "./httpException";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponseBuilder } from "../utils/response/apiResponseBuilder";

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let status = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Error interno del servidor";
  let data: any = null;

  // ✅ Validaciones Zod (input inválido)
  if (error instanceof ZodError) {
    status = StatusCodes.BAD_REQUEST;
    message = "Datos inválidos enviados";
    data = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
  }

  // ✅ Errores de negocio (Service)
  else if (error instanceof HttpException) {
    status = error.status;
    message = error.message;
    data = null; // 👈 MUY IMPORTANTE
  }

  // ✅ Errores inesperados
  else {
    console.error("Unhandled error:", error);
  }

  const response = new ApiResponseBuilder()
    .setStatusCode(status)
    .setMessage(message)
    .setData(data)
    .build();

  res.status(status).json(response);
};
