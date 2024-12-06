export interface IUserQuestionsAnswersService {
  createUserQuestionsAnswers(
    user: string,
    // questionsAnswers: { question: string; answer: string }[]
  ): Promise<string>;
}
