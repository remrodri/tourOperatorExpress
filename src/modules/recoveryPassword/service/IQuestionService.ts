
export interface IQuestionService {
  getRandomQuestions(): Promise<string[]>;
}
