import { model, Schema } from "mongoose";
import { IUserQuestionsAnswers } from "./IUserQuestionsAnswers";

const userQuestionsAnswersSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    questionsAnswers: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: "Question",
        },
        answer: {
          type: Schema.Types.ObjectId,
          ref: "Answer",
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "User_Questions_Answers",
  }
);

export const UserQuestionsAnswersModel = model<IUserQuestionsAnswers>(
  "UserQuestionsAnswers",
  userQuestionsAnswersSchema
);
