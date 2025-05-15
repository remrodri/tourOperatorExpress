import { Document, Types } from "mongoose";

export interface IPayment extends Document<Types.ObjectId> {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  bookingId: string;
}
