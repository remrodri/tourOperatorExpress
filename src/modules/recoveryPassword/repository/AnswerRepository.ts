import { AnswerModel } from "../../model/recoveryPassword/answer/answerModel";
import { IAnswer } from "../../model/recoveryPassword/answer/IAnswer";
import { IAnswerRepository } from "./IAswerRepository";

export class AnswerRepository implements IAnswerRepository {
  async createEmptyAnswer(): Promise<IAnswer> {
    const emptyAnswer = new AnswerModel();
    const answer = await emptyAnswer.save();
    return answer;
  }
}
