import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { GetQuestionsDto } from "../dto/userIdDto";
import { SecurityQuestionsVo } from "../vo/securityQuestionsVo";

export interface ISecuritySetupService {
  updateUserPassword(updatePasswodDto: UpdatePasswordDto): Promise<void>;
  getSecurityQuestions(
    getQuestionsDto: GetQuestionsDto
  ): Promise<SecurityQuestionsVo | null>;
  updateSecurityAnswers(updateAnswersDto: UpdateAnswersDto,userId:String): Promise<void>;
}
