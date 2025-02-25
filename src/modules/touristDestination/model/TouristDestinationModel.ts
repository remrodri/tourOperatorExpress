import mongoose, { Schema } from "mongoose";
import { ITouristDestination } from "./ITouristDestination";

const TouristDestinationSchema: Schema = new Schema(
  {
    name: { type: Schema.Types.String, required: true, trim: true },
    description: { type: Schema.Types.String, required: true, trim: true },
    // createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deleted: { type: Schema.Types.Boolean, default: false },
    imageFolder: { type: Schema.Types.String, required: true, unique: true },
    images: { type: [Schema.Types.String], default: [] },
  },
  {
    timestamps: true,
    collection: "Tourist_Destinations",
  }
);
export const TouristDestinationModel = mongoose.model<ITouristDestination>(
  "TouristDestination",
  TouristDestinationSchema
);
