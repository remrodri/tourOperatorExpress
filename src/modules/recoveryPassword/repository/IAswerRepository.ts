import { IAnswer } from "../model/answer/IAnswer";

export interface IAnswerRepository {
  createEmptyAnswer(): Promise<IAnswer>;
}
