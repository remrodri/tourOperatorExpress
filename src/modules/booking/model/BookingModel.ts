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
    attendance: [
      {
        touristId: {
          type: Schema.Types.ObjectId,
          ref: "Tourist",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent"], // o los estados que prefieras
          default: "absent",
        },
      },
    ],
    cancellationFee: {
      type: Schema.Types.Number,
      default: 0,
    },
    refundAmount: {
      type: Schema.Types.Number,
      default: 0,
    },
    refundedAt: {
      type: Schema.Types.Date,
      default: null,
    },
    bookingCode: {
      type: Schema.Types.String,
      // required: [true, "Reservation code is required"],
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
  {
    timestamps: true,
    collection: "Bookings",
  }
);

BookingSchema.index({ createdAt: -1, _id: -1 });
BookingSchema.index({ status: 1, createdAt: -1, _id: -1 });
BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ tourPackageId: 1, createdAt: -1, _id: -1 });
BookingSchema.index({ dateRangeId: 1, createdAt: -1, _id: -1 });
BookingSchema.index({ dateRangeId: 1, tourPackageId: 1 });

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);
