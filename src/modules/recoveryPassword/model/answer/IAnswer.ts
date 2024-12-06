import { Document, Types } from "mongoose";

export interface IAnswer extends Document<Types.ObjectId> {
  answerText: string;
}
