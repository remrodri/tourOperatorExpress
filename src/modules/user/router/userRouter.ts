import { Router } from "express";
import { UserRepository } from "../repository/UserRepository";
import { UserService } from "../service/UserService";

import { authMiddleware } from "../../../middleware/authMiddleware";
// import { RecoveryPasswordRepository } from "../../recoveryPassword/repository/RecoveryPasswordRepository";
// import { RecoveryPasswordService } from "../../recoveryPassword/service/RecoveryPasswordService";
import { QuestionRepository } from "../../recoveryPassword/repository/QuestionRepository";
import { QuestionService } from "../../recoveryPassword/service/QuestionService";
import { UserQuestionsAnswersService } from "../../recoveryPassword/service/UserQuestionsAnswersService";
import { UserQuestionsAnswersRepository } from "../../recoveryPassword/repository/UserQuestionsAnswersRepository";
import { AnswerRepository } from "../../recoveryPassword/repository/AnswerRepository";
import { AnswerService } from "../../recoveryPassword/service/AnswerService";
import { UserController } from "../controller/userController";

const userRouter: Router = Router();
// const recoveryPasswordRepository = new RecoveryPasswordRepository();
const questionRepository = new QuestionRepository();
const questionService = new QuestionService(questionRepository);
const answerRepository = new AnswerRepository();
const answerService = new AnswerService(answerRepository);
// const recoveryPasswordService = new RecoveryPasswordService(questionService);

const userRepository = new UserRepository();
const userQuestionsAnswersRepository = new UserQuestionsAnswersRepository();
const userQuestionsAnswersService = new UserQuestionsAnswersService(
  userQuestionsAnswersRepository,
  questionService,
  answerService
);
const userService = new UserService(
  userRepository,
  // recoveryPasswordService
  userQuestionsAnswersService
);
const userController = new UserController(userService);

userRouter.get("/users", authMiddleware, (req, res, next) =>
  userController.getAllUsers(req, res, next)
);

userRouter.post("/users", authMiddleware, (req, res, next) =>
  userController.createUser(req, res, next)
);
export default userRouter;
