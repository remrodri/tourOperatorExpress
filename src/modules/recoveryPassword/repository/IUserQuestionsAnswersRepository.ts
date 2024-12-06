import { IUserQuestionsAnswers } from "../model/userQuestionsAnswers/IUserQuestionsAnswers";

export interface IUserQuestionsAnswersRepository {
  createUserQuestionsAnswers(
    userId: string,
    questionsAnswers: { question: string; answer: string }[]
  ): Promise<IUserQuestionsAnswers>;
}
