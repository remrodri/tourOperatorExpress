import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { IQuestionRepository } from "../repository/IQuestionRepository";
import { IQuestionService } from "./IQuestionService";
import { IQuestion } from "../../model/recoveryPassword/question/IQuestion";

export class QuestionService implements IQuestionService {
  private readonly questionRepository: IQuestionRepository;

  constructor(questionRepository: IQuestionRepository) {
    this.questionRepository = questionRepository;
  }
  async getQuestionById(questionId: string): Promise<any | null> {
    const question = await this.questionRepository.getQuestionById(questionId);
    if (!question) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "No se encontro la question"
      );
    }
    // console.log('question::: ', question);
    return question;
  }
  async getRandomQuestions(): Promise<string[]> {
    const randomQuestionIds =
      await this.questionRepository.getRandomQuestions();
    // console.log("randomQuestion::: ", randomQuestionIds);
    // throw new Error("Method not implemented.");
    return randomQuestionIds;
  }
}
