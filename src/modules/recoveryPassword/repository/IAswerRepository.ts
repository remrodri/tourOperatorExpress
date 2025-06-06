import { IAnswer } from "../../securitySetup/model/recoveryPassword/answer/IAnswer";

export interface IAnswerRepository {
  createEmptyAnswer(): Promise<IAnswer>;
  populate(answerId: string): Promise<IAnswer | null>;
}
