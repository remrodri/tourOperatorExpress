import mongoose, { Schema } from "mongoose";
import { IDateRange } from "./IDateRange";

const moneyField = { type: Schema.Types.Number, required: true, min: 0 };
const EconomicPlanSchema = new Schema(
  {
    currency: { type: String, enum: ["BOB"], required: true },
    fixedCosts: {
      transportation: moneyField,
      guide: moneyField,
      administration: moneyField,
      fixedLodging: moneyField,
      other: moneyField,
    },
    variableCostsPerTourist: {
      food: moneyField,
      tickets: moneyField,
      lodging: moneyField,
      insurance: moneyField,
      other: moneyField,
    },
    pricePerTourist: { type: Schema.Types.Number, required: true, min: 0.01 },
    operationalMinimum: {
      type: Schema.Types.Number,
      min: 1,
      required: false,
      validate: {
        validator: (value: number | undefined) =>
          value === undefined || Number.isInteger(value),
        message: "Operational minimum must be a positive integer",
      },
    },
    planningStartedAt: { type: Schema.Types.Date, required: true },
    decisionDeadline: { type: Schema.Types.Date, required: true },
    source: { type: String, enum: ["manual", "simulated"], required: true },
    version: { type: String, enum: ["t1202-v1"], required: true },
    updatedAt: { type: Schema.Types.Date, required: true },
  },
  { _id: false },
);

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
    economicPlan: { type: EconomicPlanSchema, required: false },
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
