import { Document, Types } from "mongoose";

export interface IDateRange extends Document<Types.ObjectId> {
  dates: string[];
  state: string;
}
