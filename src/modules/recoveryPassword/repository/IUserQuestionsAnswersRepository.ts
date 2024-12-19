import { IUserQuestionsAnswers } from "../../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";

export interface IUserQuestionsAnswersRepository {
  createUserQuestionsAnswers(
    userId: string,
    questionsAnswers: { question: string; answer: string }[]
  ): Promise<IUserQuestionsAnswers>;
}
