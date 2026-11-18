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
    bookingId: {
      type: Schema.Types.String,
      ref: "Booking",
    },
    paymentProofImage: {
      type: Schema.Types.String, default: ""
    },
    sellerId: {
      type: Schema.Types.String,
      required: [true, "Seller is required"],
      ref: "User" ,
    },
    touristId: {
      type: Schema.Types.String,
      required: [true, "Tourist is required"],
      ref: "Tourist",
    },
    dataOrigin: {
      type: Schema.Types.String,
      enum: ["legacy", "simulated", "manual"],
      required: false,
    },
    simulationId: {
      type: Schema.Types.String,
      required: false,
    },
    simulationVersion: {
      type: Schema.Types.String,
      required: false,
    },
    simulationSeed: {
      type: Schema.Types.Number,
      required: false,
    },
    simulationKey: {
      type: Schema.Types.String,
      required: false,
    },
  },
  { timestamps: true, collection: "Payments" }
);
export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
