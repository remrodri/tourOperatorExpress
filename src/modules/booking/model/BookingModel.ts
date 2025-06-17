import mongoose, { Schema } from "mongoose";
import { IBooking } from "./IBooking";

const BookingSchema: Schema = new Schema(
  {
    touristsIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tourist",
      },
    ],
    dateRangeId: {
      type: Schema.Types.ObjectId,
      ref: "DateRange",
      required: [true, "Date range is required"],
    },
    notes: {
      type: Schema.Types.String,
      trim: true,
    },
    paymentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
    status: {
      type: Schema.Types.String,
      default: "pending",
      enum: ["pending", "confirmed", "cancelled", "completed"],
    },
    totalPrice: {
      type: Schema.Types.Number,
      required: [true, "Total price is required"],
    },
    tourPackageId: {
      type: Schema.Types.ObjectId,
      ref: "TourPackage",
      required: [true, "Tour Package is required"],
    },
    paymentProofFolder: {
      type: Schema.Types.String,
      required: [true, "Payment proof folder is required"],
    },
  },
  {
    timestamps: true,
    collection: "Bookings",
  }
);

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);
