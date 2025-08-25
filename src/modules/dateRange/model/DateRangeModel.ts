import mongoose, { Schema } from "mongoose";
import { IDateRange } from "./IDateRange";

const DateRangeSchema = new Schema(
  {
    // dates: { type: Schema.Types.Array },
    dates: [{ type: String }],
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
