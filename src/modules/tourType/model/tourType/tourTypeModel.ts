import { model, Schema } from "mongoose";
import { ITourType } from "./ITourType";

const tourTypeSchema: Schema = new Schema(
  {
    name: { type: Schema.Types.String, required: true },
    description: { type: Schema.Types.String, required: true },
    deleted:{type:Schema.Types.Boolean,default:false}
  },
  {
    timestamps: true,
    collection: "Tour_Types",
  }
);
export const TourTypeModel = model<ITourType>("TourType", tourTypeSchema);
