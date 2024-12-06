import { IAnswerRepository } from "../repository/IAswerRepository";
import { IAnswerService } from "./IAnswerService";

export class AnswerService implements IAnswerService {
  private readonly answerRepository: IAnswerRepository;
  constructor(answerRepository: IAnswerRepository) {
    this.answerRepository = answerRepository;
  }
  async createEmptyAnswer(): Promise<string> {
    const answerId = (
      await this.answerRepository.createEmptyAnswer()
    )._id.toString();
    return answerId;
    // throw new Error("Method not implemented.");
  }
}
