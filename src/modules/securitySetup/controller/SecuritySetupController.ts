import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { ISecuritySetupService } from "../service/ISecuritySetupService";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { GetRandomQuestionDto } from "../dto/getRandomQuestionDto";
import { IUserService } from "../../user/service/IUserService";

export class SecuritySetupController {
  private readonly securitySetupService: ISecuritySetupService;
  // private readonly userService: IUserService;

  constructor(
    securitySetupService: ISecuritySetupService
    // userService: IUserService
  ) {
    this.securitySetupService = securitySetupService;
    // this.userService = userService;
  }

  async checkSecurityAnswer(req: Request, res: Response, next: NextFunction) {
    // console.log("req.body::: ", req.body);
    try {
      const isSecurityAnswerCorrect =
        await this.securitySetupService.checkSecurityAnswer(req.body);
      console.log("isSecurityAnswerCorrect::: ", isSecurityAnswerCorrect);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("respuesta correcta")
        .setData(null)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async findUserByEmail(req: Request, res: Response, next: NextFunction) {
    console.log("req.body::: ", req.body);
    // console.log("email::: ", email);
    try {
      const { email } = req.body;
      // const user = await this.userService.findUserByEmail(email);
      const user = await this.securitySetupService.findUserByEmail(email);
      console.log("user::: ", user);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("El usuario existe")
        .setData(user)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getRandomQuestion(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;
    try {
      const randomQuestion =
        await this.securitySetupService.getRandomSecurityQuestion(userId);
      console.log("randomQuestion::: ", randomQuestion);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Pregunta de seguridad encontrada")
        .setData(randomQuestion)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // async getRandomSecurityQuestion(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     // console.log("req.body::: ", req.body);
  //     const getRandomQuestionDto = GetRandomQuestionDto.parse(req.body);
  //     const randomQuestion =
  //       await this.securitySetupService.getRandomSecurityQuestion(
  //         getRandomQuestionDto
  //       );
  //     // console.log('randomQuestion::: ', randomQuestion);
  //     const response = new ApiResponseBuilder()
  //       .setStatusCode(StatusCodes.OK)
  //       .setMessage("Pregunta de seguridad obtenida con exito")
  //       .setData(randomQuestion)
  //       .build();
  //     res.status(StatusCodes.OK).json(response);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  async updateSecurityAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      // console.log("req.body::: ", req.body);
      const updateAnswersDto = UpdateAnswersDto.parse(req.body.answers);
      // console.log('dto::: ', dto);

      // const updatedAnswers =
      await this.securitySetupService.updateSecurityAnswers(
        updateAnswersDto,
        req.body.userId
      );
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
