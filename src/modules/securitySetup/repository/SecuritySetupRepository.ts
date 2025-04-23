import { AnswerModel } from "../model/recoveryPassword/answer/answerModel";
import { IAnswer } from "../model/recoveryPassword/answer/IAnswer";
import { IQuestion } from "../model/recoveryPassword/question/IQuestion";
import { IUserQuestionsAnswers } from "../model/recoveryPassword/userQuestionsAnswers/IUserQuestionsAnswers";
import { UserQuestionsAnswersModel } from "../model/recoveryPassword/userQuestionsAnswers/userQuestionsAnswersModel";
import { IUser } from "../../user/model/IUser";
import { UserModel } from "../../user/model/userModel";
import { GetRandomQuestionDto } from "../dto/getRandomQuestionDto";
import { UpdateAnswersDto } from "../dto/updateAnswersDto";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { GetQuestionsDto } from "../dto/userIdDto";
import { ISecuritySetupRepository } from "./ISecuritySetupRepository";
import bcrypt from "bcryptjs";

export class SecuritySetupRepository implements ISecuritySetupRepository {
  getRandomSecurityQuestion(
    getRandomQuestionDto: GetRandomQuestionDto
  ): Promise<IQuestion> {
    console.log("getRandomQuestionDtoRepo::: ", getRandomQuestionDto);
    throw new Error("Method not implemented.");
  }
  async updateAnswers(updateAnswersDto: UpdateAnswersDto): Promise<any[]> {
    const updatedAnswers = await Promise.all(
      updateAnswersDto.map(
        async (answer) =>
          await AnswerModel.findByIdAndUpdate(
            answer.answerId,
            {
              answerText: answer.answerText,
            },
            { new: true }
          )
      )
    );
    // console.log('updatedAnswers::: ', updatedAnswers);
    return updatedAnswers;
    // throw new Error("Method not implemented.");
  }

  async getSecurityQuestions(
    questionsAnswersId: string
  ): Promise<IUserQuestionsAnswers | null> {
    const userQuestionsAnswers = await UserQuestionsAnswersModel.findById(
      questionsAnswersId
    ).populate("questionsAnswers.question");
    // console.log("userQuestionsAnswers::: ", userQuestionsAnswers);
    return userQuestionsAnswers;
    // throw new Error("Method not implemented.");
  }
  async findUserById(userId: string): Promise<IUser | null> {
    return await UserModel.findById(userId);
  }
  async updatePassword(
    updatePasswodDto: UpdatePasswordDto
  ): Promise<IUser | null> {
    // console.log("updatePasswodDto::: ", updatePasswodDto);
    const passwordToUpdate = await bcrypt.hash(
      updatePasswodDto.newPassword,
      10
    );
    // console.log('passwordToUpdate::: ', passwordToUpdate);
    const user = await UserModel.findByIdAndUpdate(
      updatePasswodDto.userId,
      {
        password: passwordToUpdate,
      },
      { new: true }
    );
    // console.log('user::: ', user);
    return user;
  }
}
