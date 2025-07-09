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
  },
  {
    timestamps: true,
    collection: "Tourists",
  }
);
export const TouristModel = mongoose.model<ITourist>("Tourist", TouristSchema);
