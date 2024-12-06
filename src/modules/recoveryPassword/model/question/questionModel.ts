import mongoose, { Schema } from "mongoose";
import { IQuestion } from "./IQuestion";

const QuestionSchema: Schema = new Schema(
  {
    questionText: { type: Schema.Types.String },
  },
  {
    collection: "Questions",
  }
);

export const QuestionsModel = mongoose.model<IQuestion>("Question", QuestionSchema);