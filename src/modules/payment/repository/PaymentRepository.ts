import { ClientSession } from "mongoose";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { IPayment } from "../model/IPayment";
import { IPaymentRepository } from "./IPaymentRepository";
import { PaymentModel } from "../model/PaymentModel";
import mongoose from "mongoose";

export class PaymentRepository implements IPaymentRepository {
  async getAllDB(): Promise<IPayment[]> {
    return await PaymentModel.find().exec();
  }
  async createDB(
    dto: CreatePaymentDto,
    session?: mongoose.ClientSession
  ): Promise<IPayment | null> {
    const payment = new PaymentModel(dto);
    // console.log('payment de repo::: ', payment);

    const savedPayment = session
      ? await payment.save({ session })
      : await payment.save();

    // console.log("savedPayment::: ", savedPayment);
    return savedPayment;
  }
}
