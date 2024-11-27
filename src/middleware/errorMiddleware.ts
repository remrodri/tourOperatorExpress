import { ZodError } from "zod";
import { HttpException } from "./httpException";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponseBuilder } from "../utils/response/apiResponseBuilder";

export const errorMiddleware = (
  error: HttpException | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Error interno del servidor";
  let details: any = null;

  if (error instanceof ZodError) {
    status = StatusCodes.BAD_REQUEST;
    message = "Error de validacion de zod.";
    details = error.errors.map((err) => ({
      path: err.path,
      message: err.message,
      validation: err.code,
    }));
  } else if (error instanceof HttpException) {
    status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    message = error.message || "Error interno del servidor";
  }

  const response = new ApiResponseBuilder()
    .setStatusCode(status)
    .setMessage(message)
    .setData(details)
    .build();

  res.status(status).json(response);
};
