import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { IAnswerRepository } from "../repository/IAswerRepository";
import { IAnswerService } from "./IAnswerService";
import { response } from "express";
import { AnswerVo } from "../vo/answerVo";

export class AnswerService implements IAnswerService {
  private readonly answerRepository: IAnswerRepository;
  constructor(answerRepository: IAnswerRepository) {
    this.answerRepository = answerRepository;
  }
  async populateAnswer(answerId: string): Promise<any | null> {
    // console.log('answerId:::> ', answerId);
    const answer = await this.answerRepository.populate(answerId);
    console.log('answer::: ', answer);
    if (!answer) {
      throw new HttpException(StatusCodes.NOT_FOUND, "No se encontro la respuesta");
    }
    // const response = { answer: answer?.answerText };
    const answervo = new AnswerVo(answer.answerText)
    // console.log('answervo::: ', answervo);
    // console.log('answer::: ', answer);
    return answervo;
    // throw new Error("Method not implemented.");
  }
  async createEmptyAnswer(): Promise<string> {
    const answerId = (
      await this.answerRepository.createEmptyAnswer()
    )._id.toString();
    return answerId;
    // throw new Error("Method not implemented.");
  }
}
