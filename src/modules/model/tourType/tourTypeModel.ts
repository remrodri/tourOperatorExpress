import { model, Schema } from "mongoose";
import { ITourType } from "./ITourType";

const tourTypeSchema: Schema = new Schema(
  {
    name: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: true },
  },
  {
    timestamps: true,
    collection: "Tour_Types",
  }
);
export const TourTypeModel = model<ITourType>("TourType", tourTypeSchema);
