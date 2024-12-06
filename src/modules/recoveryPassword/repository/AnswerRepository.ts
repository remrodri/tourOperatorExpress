import { AnswerModel } from "../model/answer/answerModel";
import { IAnswer } from "../model/answer/IAnswer";
import { IAnswerRepository } from "./IAswerRepository";

export class AnswerRepository implements IAnswerRepository {
  async createEmptyAnswer(): Promise<IAnswer> {
    const emptyAnswer = new AnswerModel();
    const answer = (await emptyAnswer.save());
    return answer;
    throw new Error("Method not implemented.");
  }
}
