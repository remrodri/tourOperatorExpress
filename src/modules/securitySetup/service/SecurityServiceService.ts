import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { ISecuritySetupRepository } from "../repository/ISecuritySetupRepository";
import { ISecuritySetupService } from "./ISecuritySetupService";
import { GetQuestionsDto } from "../dto/userIdDto";
import { IUser } from "../../model/user/IUser";
import { IUserQuestionsAnswers } from "../../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";
import { SecurityQuestionsVo } from "../vo/securityQuestionsVo";
import { AnswerModel } from "../../model/recoveryPassword/answer/answerModel";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { IUserService } from "../../user/service/IUserService";

export class SecuritySetupService implements ISecuritySetupService {
  private readonly securitySetupRepository: ISecuritySetupRepository;
  private readonly userService: IUserService;

  constructor(
    securitySetupRepository: ISecuritySetupRepository,
    userService: IUserService
  ) {
    this.securitySetupRepository = securitySetupRepository;
    this.userService = userService;
  }
  async updateSecurityAnswers(
    updateAnswersDto: UpdateAnswersDto,
    userId: string
  ): Promise<void> {
    console.log("userId::: ", userId);
    // console.log("answers::: ", answers);
    const updatedAnswers = await Promise.all(
      await this.securitySetupRepository.updateAnswers(updateAnswersDto)
    );
    // console.log("updatedAnswers::: ", updatedAnswers);
    if (!updatedAnswers) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Las respuestas de seguridad no se actualizaron"
      );
    }
    const userUpdated = this.userService.updateFirstLogin(userId);
    if (!userUpdated) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "El usuario no se actualizó"
      );
    }
    // const userUpdated =

    // throw new Error("Method not implemented.");
  }

  async getSecurityQuestions(
    getQuestionsDto: GetQuestionsDto
  ): Promise<SecurityQuestionsVo | null> {
    // console.log("SERVICE::: ");
    const user = await this.securitySetupRepository.findUserById(
      getQuestionsDto.userId
    );
    // console.log("user::: ", user);
    if (!user) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El usuarion no existe");
    }
    const questions = await this.securitySetupRepository.getSecurityQuestions(
      user.questionsAnswers.toString()
    );
    if (!questions) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "No hay preguntas para el usuario"
      );
    }
    // console.log("questions::: ", questions?.questionsAnswers);

    const securityQuestionsVo = new SecurityQuestionsVo(
      questions.questionsAnswers
    );
    // console.log("securityQuestionsVo::: ", securityQuestionsVo);
    return securityQuestionsVo;
  }

  async updateUserPassword(updatePasswodDto: UpdatePasswordDto): Promise<void> {
    const user = await this.securitySetupRepository.findUserById(
      updatePasswodDto.userId
    );
    if (!user) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "El usuario no existe");
    }
    const response = await this.securitySetupRepository.updatePassword(
      updatePasswodDto
    );
    if (!response) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Nose actualizo el password"
      );
    }
    // console.log("response::: ", response);
    // throw new Error("Method not implemented.");
  }
}
