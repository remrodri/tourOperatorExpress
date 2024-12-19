import { model, Schema } from "mongoose";
import { IAnswer } from "./IAnswer";

const AnswerSchema: Schema = new Schema(
  {
    answerText: { type: Schema.Types.String, default:"" },
  },
  { collection: "Answers" }
);

export const AnswerModel = model<IAnswer>("Answer", AnswerSchema);
