import { IAnswer } from "../../model/recoveryPassword/answer/IAnswer";
import { IUserQuestionsAnswers } from "../../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";
import { IUser } from "../../model/user/IUser";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { GetQuestionsDto } from "../dto/userIdDto";

export interface ISecuritySetupRepository {
  updatePassword(updatePasswodDto: UpdatePasswordDto): Promise<any>;
  findUserById(userId: string): Promise<IUser | null>;
  getSecurityQuestions(
    questionsAnswersId: string
  ): Promise<IUserQuestionsAnswers | null>;
  updateAnswers(updateAnswersDto: UpdateAnswersDto): Promise<any[]>;
}
