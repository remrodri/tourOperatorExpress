import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { IUserQuestionsAnswersRepository } from "../repository/IUserQuestionsAnswersRepository";
import { IAnswerService } from "./IAnswerService";
import { IQuestionService } from "./IQuestionService";
import { IUserQuestionsAnswersService } from "./IUserQuestionsAnswersService";
import { IQuestion } from "../../model/recoveryPassword/question/IQuestion";

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
  async populateAnswer(answerId: string): Promise<any> {
    // console.log('answerId::: ', answerId);
    const answer = await this.answerService.populateAnswer(answerId);
    console.log('answer::: ', answer);
    
    return answer;
    // console.log("answerId::: ", answerId);

    // throw new Error("Method not implemented.");
  }
  async getRandomQuestion(userQuestionsAnsersId: string): Promise<any | null> {
    const userQuestionsAnswers = await this.getUserQuestionsAnswers(
      userQuestionsAnsersId
    );
    if (!userQuestionsAnswers) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "UserQuestionsAnswers no se encontro"
      );
    }

    const questions = userQuestionsAnswers.questionsAnswers;
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestionAsnwer = questions[randomIndex];
    const randomQuestionId = randomQuestionAsnwer.question.toString();
    const randomQuestion = await this.questionsService.getQuestionById(
      randomQuestionId
    );
    if (!randomQuestion) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Question no se encontro");
    }
    // console.log("randomQuestion::: ", randomQuestion);

    // const randomQuestion = this.questionsService
    return randomQuestion;
    // throw new Error("Method not implemented.");
  }

  async getUserQuestionsAnswers(userQuestionsAnswersId: string): Promise<any> {
    const userQuestionsAnswersFound =
      await this.userQuestionsAnswersRepository.getUserQuestionsAnswers(
        userQuestionsAnswersId
      );
    // throw new Error("Method not implemented.");
    if (!userQuestionsAnswersFound) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "UserQuestionsAnswers no se encontraron"
      );
    }
    return userQuestionsAnswersFound;
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
