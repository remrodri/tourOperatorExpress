import { NextFunction, Request, Response } from "express";
import { IPaymentService } from "../service/IPaymentService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
export class PaymentController {
  private readonly paymentService: IPaymentService;
  constructor(paymentService: IPaymentService) {
    this.paymentService = paymentService;
  }

  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.paymentService.getAll();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("payments found succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
