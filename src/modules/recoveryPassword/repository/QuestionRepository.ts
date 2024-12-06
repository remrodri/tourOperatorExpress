import { QuestionsModel } from "../model/question/questionModel";
import { QuestionIdVo } from "../vo/questionIdVo";
import { IQuestionRepository } from "./IQuestionRepository";

export class QuestionRepository implements IQuestionRepository {
  async getRandomQuestions(): Promise<string[]> {
    const questions = await QuestionsModel.aggregate([
      { $sample: { size: 3 } },
    ]);
    return questions.map((question) => question._id.toString());
    // throw new Error("Method not implemented.");
  }
}
