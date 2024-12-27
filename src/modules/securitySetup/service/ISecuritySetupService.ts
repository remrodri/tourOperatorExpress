import { IUser } from "../../model/user/IUser";
import { GetRandomQuestionDto } from "../dto/getRandomQuestionDto";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { GetQuestionsDto } from "../dto/userIdDto";
import { SecurityQuestionsVo } from "../vo/securityQuestionsVo";

export interface ISecuritySetupService {
  updateUserPassword(updatePasswodDto: UpdatePasswordDto): Promise<void>;
  getSecurityQuestions(
    getQuestionsDto: GetQuestionsDto
  ): Promise<SecurityQuestionsVo | null>;
  updateSecurityAnswers(
    updateAnswersDto: UpdateAnswersDto,
    userId: String
  ): Promise<void>;
  getRandomSecurityQuestion(userId: string): Promise<any>;
  findUserByEmail(email: string): Promise<any | null>;
  checkSecurityAnswer(answer: {
    userId: string;
    questionId: string;
    answerText: string;
  }): Promise<boolean>;
}
