
export interface IQuestionService {
  getRandomQuestions(): Promise<string[]>;
  // getRandomQuestion(userQuestionsAnswersId:string):Promise<any>
  getQuestionById(questionId:string):Promise<any |null>

}
