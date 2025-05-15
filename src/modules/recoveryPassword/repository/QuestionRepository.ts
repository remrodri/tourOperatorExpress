import { IQuestion } from "../../securitySetup/model/recoveryPassword/question/IQuestion";
import { QuestionsModel } from "../../securitySetup/model/recoveryPassword/question/questionModel";
import { IQuestionRepository } from "./IQuestionRepository";

export class QuestionRepository implements IQuestionRepository {
  async getQuestionById(questionId: string): Promise<IQuestion | null> {
    return await QuestionsModel.findById(questionId);
    // throw new Error("Method not implemented.");
  }

  async getRandomQuestions(): Promise<string[]> {
    const questions = await QuestionsModel.aggregate([
      { $sample: { size: 3 } },
    ]);
    return questions.map((question) => question._id.toString());
    // throw new Error("Method not implemented.");
  }
}
