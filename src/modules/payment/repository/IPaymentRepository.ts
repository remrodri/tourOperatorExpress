import mongoose from "mongoose";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { IPayment } from "../model/IPayment";

export interface IPaymentRepository {
  createDB(
    dto: CreatePaymentDto,
    session?: mongoose.ClientSession
  ): Promise<IPayment|null>;
  
}
