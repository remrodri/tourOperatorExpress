export class SecurityQuestionsVo {
  constructor(
    public readonly questionsAnswers: {
      questionsAnswers: { _id: string; questionText: string };
      answer: string;
      _id: string;
    }[]
  ) {}
}
