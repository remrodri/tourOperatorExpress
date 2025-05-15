import { IQuestion } from "../../securitySetup/model/recoveryPassword/question/IQuestion";

export interface IUserQuestionsAnswersService {
  createUserQuestionsAnswers(
    user: string
    // questionsAnswers: { question: string; answer: string }[]
  ): Promise<string>;
  getUserQuestionsAnswers(userQuestionsAnswersId: string): Promise<any>;
  getRandomQuestion(userQuestionsAnsersId: string): Promise<any | null>;
  populateAnswer(answerId: string): Promise<any>;
}
