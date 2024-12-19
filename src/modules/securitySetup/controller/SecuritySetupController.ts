import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { ISecuritySetupService } from "../service/ISecuritySetupService";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { GetQuestionsDto } from "../dto/userIdDto";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";

export class SecuritySetupController {
  private readonly securitySetupService: ISecuritySetupService;

  constructor(securitySetupService: ISecuritySetupService) {
    this.securitySetupService = securitySetupService;
  }

  async updateSecurityAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      // console.log("req.body::: ", req.body);
      const updateAnswersDto = UpdateAnswersDto.parse(req.body.answers);
      // console.log('dto::: ', dto);

      // const updatedAnswers =
      await this.securitySetupService.updateSecurityAnswers(updateAnswersDto,req.body.userId);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Respuestas de seguridad actualizadas exitosamente")
        .setData(null)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSecurityQuestions(req: Request, res: Response, next: NextFunction) {
    // const getQuestionsDto = GetQuestionsDto.parse(req.body);
    try {
      const securityQuestions =
        await this.securitySetupService.getSecurityQuestions(req.body);
      const Response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Preguntas de seguridad obtenidas exitosamente")
        .setData(securityQuestions)
        .build();
      res.status(StatusCodes.OK).json(Response);
    } catch (error) {
      next(error);
    }
  }

  async updateUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // console.log("req.body::: ", req.body);
      const updatePasswordDto = UpdatePasswordDto.parse(req.body);
      await this.securitySetupService.updateUserPassword(updatePasswordDto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Password actualizado exitosamente")
        .setData(null)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      // const response = new ApiResponseBuilder()
      //   .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
      //   .setMessage("Error updating user password")
      //   .build();
      // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      next(error);
    }
  }
}
