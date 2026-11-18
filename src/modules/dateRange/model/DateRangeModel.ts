import mongoose, { Schema } from "mongoose";
import { IDateRange } from "./IDateRange";

const DateRangeSchema = new Schema(
  {
    // dates: { type: Schema.Types.Array },
    dates: [{ type: String }],
    startDate: {
      type: Schema.Types.Date,
      required: false,
    },
    endDate: {
      type: Schema.Types.Date,
      required: false,
    },
    capacity: {
      type: Schema.Types.Number,
      required: false,
      validate: {
        validator: (value: number | null | undefined) =>
          value === undefined ||
          value === null ||
          (Number.isInteger(value) && value > 0),
        message: "Capacity must be a positive integer",
      },
    },
    dataOrigin: {
      type: Schema.Types.String,
      enum: ["legacy", "simulated", "manual"],
      default: "legacy",
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
    state: {
      type: Schema.Types.String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    // guides: { type: Schema.Types.Array },
    guides: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tourPackageId: {
      type: Schema.Types.ObjectId,
      ref: "TourPackage",
      // default: "",
      required: false,
    },
  },
  { timestamps: true, collection: "Date_Ranges" }
);

export const DateRangeModel = mongoose.model<IDateRange>(
  "DateRange",
  DateRangeSchema
);
