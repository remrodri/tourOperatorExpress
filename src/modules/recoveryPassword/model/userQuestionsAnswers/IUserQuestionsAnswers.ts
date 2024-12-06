import { Document, Types } from "mongoose";

export interface IUserQuestionsAnswers extends Document<Types.ObjectId> {
  user: string;
  questionsAnswers: [any, any];
}
