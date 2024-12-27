export interface IAnswerService {
  createEmptyAnswer(): Promise<string>;
  populateAnswer(answerId: string): Promise<any | null>;
}
