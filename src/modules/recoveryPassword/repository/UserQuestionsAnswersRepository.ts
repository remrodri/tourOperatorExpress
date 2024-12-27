import { IUserQuestionsAnswers } from "../../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";
import { UserQuestionsAnswersModel } from "../../model/recoveryPassword/userQuestionsAnswers/userQuestionsAnswersModel";
import { IUserQuestionsAnswersRepository } from "./IUserQuestionsAnswersRepository";

export class UserQuestionsAnswersRepository
  implements IUserQuestionsAnswersRepository
{
  async getUserQuestionsAnswers(
    userQuestionsAnswersId: string
  ): Promise<IUserQuestionsAnswers | null> {
    const userQuestionsAnswers = await UserQuestionsAnswersModel.findById(
      userQuestionsAnswersId
    )
      // .populate("user")
      .exec();
    // throw new Error("Method not implemented.");
    return userQuestionsAnswers;
  }
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
