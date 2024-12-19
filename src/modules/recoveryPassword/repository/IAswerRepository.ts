import { IAnswer } from "../../model/recoveryPassword/answer/IAnswer";

export interface IAnswerRepository {
  createEmptyAnswer(): Promise<IAnswer>;
}
