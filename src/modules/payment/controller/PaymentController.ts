import { NextFunction, Request, Response } from "express";
import { IPaymentService } from "../service/IPaymentService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
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

  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreatePaymentDto.parse(req.body);
      // console.log('dto::: ', dto);
      const vo = await this.paymentService.createSinglePayment(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("payment created succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
