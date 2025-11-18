import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { ISecuritySetupRepository } from "../repository/ISecuritySetupRepository";
import { ISecuritySetupService } from "./ISecuritySetupService";
import { GetQuestionsDto } from "../dto/userIdDto";
// import { IUser } from "../../model/user/IUser";
// import { IUserQuestionsAnswers } from "../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";
import { SecurityQuestionsVo } from "../vo/securityQuestionsVo";
// import { AnswerModel } from "../model/recoveryPassword/answer/answerModel";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { IUserService } from "../../user/service/IUserService";
// import { GetRandomQuestionDto } from "../dto/getRandomQuestionDto";
import { IUserQuestionsAnswersService } from "../../recoveryPassword/service/IUserQuestionsAnswersService";
// import { IQuestion } from "../model/recoveryPassword/question/IQuestion";

export class SecuritySetupService implements ISecuritySetupService {
  private readonly securitySetupRepository: ISecuritySetupRepository;
  private readonly userService: IUserService;
  private readonly userQuestionsAnswersService: IUserQuestionsAnswersService;

  constructor(
    securitySetupRepository: ISecuritySetupRepository,
    userService: IUserService,
    userQuestionsAnswersService: IUserQuestionsAnswersService
  ) {
    this.securitySetupRepository = securitySetupRepository;
    this.userService = userService;
    this.userQuestionsAnswersService = userQuestionsAnswersService;
  }
  async checkSecurityAnswer(answer: {
    userId: string;
    questionId: string;
    answerText: string;
  }): Promise<boolean> {
    // console.log('answer::: ', answer);
    const user = await this.userService.getUserById(answer.userId);
    // console.log("user::: ", user);
    const userQuestionsAnswers =
      await this.userQuestionsAnswersService.getUserQuestionsAnswers(
        user.questionsAnswers
      );
    // console.log('userQuestionsAnswers::: ', userQuestionsAnswers);
    const questionsAnswers = userQuestionsAnswers.questionsAnswers;
    const questionAnswerFound = questionsAnswers.find(
      (questionAnswer: any) =>
        questionAnswer.question.toString() === answer.questionId
    );
    // console.log('questionAnswerFound::: ', questionAnswerFound);
    const answerPopulated =
      await this.userQuestionsAnswersService.populateAnswer(
        questionAnswerFound.answer.toString()
      );
    console.log("answerPopulated::: ", answerPopulated);
    const response = answerPopulated.answerText === answer.answerText;
    if (!response) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, "Respuesta incorrecta");
    }
    return response;
    // console.log("questionAnswerFound::: ", questionAnswerFound);

    // const question = userQuestionsAnswers.map(userQuestionAnswer=>answer.questionId==)
    // console.log("userQuestionsAnswers::: ", userQuestionsAnswers);
    // throw new Error("Method not implemented.");
  }
  async findUserByEmail(email: string): Promise<any | null> {
    // console.log('email::::::::::::: ', email);
    const user = await this.userService.findUserByEmail(email);
    // console.log('user::: ', user);
    // if (!user) {
    //   throw new HttpException(StatusCodes.NOT_FOUND, "User no encontrado");
    // }
    // console.log("user::: ", user);

    return { userId: user._id };
    // throw new Error("Method not implemented.");
  }
  async getRandomSecurityQuestion(userId: string): Promise<any> {
    const user = await this.userService.getUserById(userId);
    const userQuestionsAnswersId = user.questionsAnswers.toString();
    // console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
    // console.log("user::: ", user);
    const randomQuestion =
      await this.userQuestionsAnswersService.getRandomQuestion(
        userQuestionsAnswersId
      );
    // console.log('randomQuestion::: ', randomQuestion);
    if (!randomQuestion) {
      throw new HttpException(StatusCodes.NOT_FOUND, "pregunta no encontrada");
    }
    const response = {
      questionId: randomQuestion._id.toString(),
      questionText: randomQuestion.questionText,
    };
    return response;
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
