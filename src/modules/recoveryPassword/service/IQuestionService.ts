import { QuestionIdVo } from "../vo/questionIdVo";

export interface IQuestionService {
  getRandomQuestions(): Promise<string[]>;
}
