import { IUserQuestionsAnswers } from "../../securitySetup/model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";

export interface IUserQuestionsAnswersRepository {
  createUserQuestionsAnswers(
    userId: string,
    questionsAnswers: { question: string; answer: string }[]
  ): Promise<IUserQuestionsAnswers>;

  getUserQuestionsAnswers(
    userQuestionsAnswersId: string
  ): Promise<IUserQuestionsAnswers | null>;
}
