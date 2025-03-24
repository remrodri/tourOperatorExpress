import mongoose, { Schema } from "mongoose";
import { IDateRange } from "./IDateRange";

const DateRangeSchema = new Schema(
  {
    dates: { type: Schema.Types.Array },
    state: { type: Schema.Types.String, default: "activo" },
  },
  { timestamps: true, collection: "Date_Ranges" }
);

export const DateRangeModel = mongoose.model<IDateRange>(
  "DateRange",
  DateRangeSchema
);
