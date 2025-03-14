import { Document, Types } from "mongoose";

export interface IActivity extends Document<Types.ObjectId> {
  description: string;
  time: string;
}
