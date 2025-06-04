import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { IPayment } from "../model/IPayment";
import { PaymentVo } from "../vo/PaymentVo";
import { ClientSession } from "mongoose";

export interface IPaymentService {
  createSinglePayment(dto:CreatePaymentDto):Promise<PaymentVo>
  
  getAll(): Promise<PaymentVo[]>;
  create(
    dto: CreatePaymentDto,
    session?: ClientSession
  ): Promise<PaymentVo>;
  mapToVo(payment: IPayment): PaymentVo;
}
