import mongoose, { Schema } from "mongoose";
import { ITourist } from "./ITourist";

const TouristSchema: Schema = new Schema(
  {
    firstName: { type: Schema.Types.String, required: true },
    lastName: { type: Schema.Types.String, required: true },
    phone: { type: Schema.Types.String, required: true },
    email: { type: Schema.Types.String, required: true },
    nationality: { type: Schema.Types.String, required: true },
    documentType: { type: Schema.Types.String, required: true },
    ci: { type: Schema.Types.String },
    passportNumber: { type: Schema.Types.String },
    dateOfBirth: { type: Schema.Types.String },
    // status: { type: Schema.Types.String },
    bookingIds: [{ type: Schema.Types.String }],
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
    collection: "Tourists",
  }
);
TouristSchema.index({ createdAt: -1, _id: -1 });
TouristSchema.index({ ci: 1 });
TouristSchema.index({ passportNumber: 1 });
TouristSchema.index({ email: 1 });

export const TouristModel = mongoose.model<ITourist>("Tourist", TouristSchema);
