import { AnswerModel } from "../../model/recoveryPassword/answer/answerModel";
import { IAnswer } from "../../model/recoveryPassword/answer/IAnswer";
import { IAnswerRepository } from "./IAswerRepository";

export class AnswerRepository implements IAnswerRepository {
  async populate(answerId: string): Promise<IAnswer | null> {
    console.log('answerId:::>>>>>>>>>> ', answerId);
    const answer = await AnswerModel.findById(answerId);
    console.log('answer:::>>>>>>>>>>>>> ', answer);
    return answer;
    // throw new Error("Method not implemented.");
  }
  async createEmptyAnswer(): Promise<IAnswer> {
    const emptyAnswer = new AnswerModel();
    const answer = await emptyAnswer.save();
    return answer;
  }
}
