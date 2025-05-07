import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { IPayment } from "../model/IPayment";
import { PaymentVo } from "../vo/PaymentVo";
import mongoose, { ClientSession } from "mongoose";

export interface IPaymentService {
  getAll(): Promise<PaymentVo[]>;
  create(
    dto: CreatePaymentDto,
    session?: mongoose.ClientSession
  ): Promise<PaymentVo>;
  mapToVo(payment: IPayment): PaymentVo;
}
