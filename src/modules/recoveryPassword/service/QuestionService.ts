import { IQuestionRepository } from "../repository/IQuestionRepository";
import { QuestionIdVo } from "../vo/questionIdVo";
import { IQuestionService } from "./IQuestionService";

export class QuestionService implements IQuestionService {
  private readonly questionRepository: IQuestionRepository;

  constructor(questionRepository: IQuestionRepository) {
    this.questionRepository = questionRepository;
  }
  async getRandomQuestions(): Promise<string[]> {
    const randomQuestionIds = await this.questionRepository.getRandomQuestions();
    // console.log("randomQuestion::: ", randomQuestionIds);
    // throw new Error("Method not implemented.");
    return randomQuestionIds;
  }
}
