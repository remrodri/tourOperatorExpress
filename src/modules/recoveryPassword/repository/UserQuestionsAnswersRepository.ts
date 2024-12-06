import { IUserQuestionsAnswers } from "../model/userQuestionsAnswers/IUserQuestionsAnswers";
import { UserQuestionsAnswersModel } from "../model/userQuestionsAnswers/userQuestionsAnswersModel";
import { IUserQuestionsAnswersRepository } from "./IUserQuestionsAnswersRepository";

export class UserQuestionsAnswersRepository
  implements IUserQuestionsAnswersRepository
{
  async createUserQuestionsAnswers(
    user: string,
    questionsAnswers: { question: string; answer: string }[]
  ): Promise<IUserQuestionsAnswers> {
    const userQuestionsAnswers = new UserQuestionsAnswersModel({
      user: user,
      questionsAnswers: questionsAnswers,
    });
    const userQuestionsAnswersId = await userQuestionsAnswers.save();
    return userQuestionsAnswersId;
    // throw new Error("Method not implemented.");
  }
}
