import { Document, Types } from "mongoose";

export interface IQuestion extends Document<Types.ObjectId> {
  questiontText: string;
}
