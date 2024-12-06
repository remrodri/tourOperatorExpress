import { IUserQuestionsAnswersRepository } from "../repository/IUserQuestionsAnswersRepository";
import { IAnswerService } from "./IAnswerService";
import { IQuestionService } from "./IQuestionService";
import { IUserQuestionsAnswersService } from "./IUserQuestionsAnswersService";

export class UserQuestionsAnswersService
  implements IUserQuestionsAnswersService
{
  private readonly userQuestionsAnswersRepository: IUserQuestionsAnswersRepository;
  private readonly questionsService: IQuestionService;
  private readonly answerService: IAnswerService;

  constructor(
    userQuestionsAnswersRepository: IUserQuestionsAnswersRepository,
    questionsService: IQuestionService,
    answerService: IAnswerService
  ) {
    this.userQuestionsAnswersRepository = userQuestionsAnswersRepository;
    this.questionsService = questionsService;
    this.answerService = answerService;
  }

  async createUserQuestionsAnswers(
    user: string
    // questionsAnswers: { question: string; answer: string }[]
  ): Promise<string> {
    // console.log("user::: ", user);
    const randomQuestionIds = await this.questionsService.getRandomQuestions();
    const questionsAnswers = await Promise.all(
      randomQuestionIds.map(async (questionId) => {
        const answerId = await this.answerService.createEmptyAnswer();
        return { question: questionId, answer: answerId };
      })
    );
    // console.log('questionsAnswers::: ', questionsAnswers);
    const userQuestionsAnswers =
      await this.userQuestionsAnswersRepository.createUserQuestionsAnswers(
        user,
        questionsAnswers
      );
    return userQuestionsAnswers._id.toString();
    // throw new Error("Method not implemented.");
  }
}
