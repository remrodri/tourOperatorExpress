import { IQuestion } from "../../model/recoveryPassword/question/IQuestion";
import { QuestionIdVo } from "../vo/questionIdVo";

export interface IQuestionRepository {
  getRandomQuestions(): Promise<string[]>;
  // getRandomQuestion(userQuestionsAnswersId: string): Promise<IQuestion | null>;
  getQuestionById(questionId: string): Promise<IQuestion | null>;
}
