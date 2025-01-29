import { Document, Types } from "mongoose";

export interface ITourType extends Document<Types.ObjectId> {
  name: string;
  description: string;
}
