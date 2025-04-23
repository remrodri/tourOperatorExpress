import mongoose, { Schema } from "mongoose";
import { IPayment } from "./IPayment";

const PaymentSchema: Schema = new Schema(
  {
    amount: {
      type: Schema.Types.Number,
      required: [true, "Amount is required"],
    },
    paymentDate: {
      type: Schema.Types.String,
      required: [true, "Payment date is required"],
    },
    paymentMethod: {
      type: Schema.Types.String,
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: Schema.Types.String,
    },
    bookingId: {
      type: Schema.Types.String,
      ref: "Booking",
    },
  },
  { timestamps: true, collection: "Payments" }
);
export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
