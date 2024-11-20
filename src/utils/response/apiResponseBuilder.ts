import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "./apiResponse";

export class ApiResponseBuilder<T> {
  private statusCode: number = StatusCodes.OK;
  private message: string = "Succes";
  private data: T | null = null;

  setStatusCode(statusCode: number): ApiResponseBuilder<T> {
    this.statusCode = statusCode;
    return this;
  }

  setMessage(message: string): ApiResponseBuilder<T> {
    this.message = message;
    return this;
  }

  setData(data: T): ApiResponseBuilder<T> {
    this.data = data;
    return this;
  }

  build(): ApiResponse<T> {
    return new ApiResponse(this.statusCode, this.message, this.data);
  }
}
