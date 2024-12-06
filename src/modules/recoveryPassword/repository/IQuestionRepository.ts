import { QuestionIdVo } from "../vo/questionIdVo";

export interface IQuestionRepository {
  getRandomQuestions(): Promise<string[]>;
}
