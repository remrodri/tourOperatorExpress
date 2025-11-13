import { Router } from "express";
import { UserRepository } from "../repository/UserRepository";
import { UserService } from "../service/UserService";

import { authMiddleware } from "../../../middleware/authMiddleware";
import { QuestionRepository } from "../../recoveryPassword/repository/QuestionRepository";
import { QuestionService } from "../../recoveryPassword/service/QuestionService";
import { UserQuestionsAnswersService } from "../../recoveryPassword/service/UserQuestionsAnswersService";
import { UserQuestionsAnswersRepository } from "../../recoveryPassword/repository/UserQuestionsAnswersRepository";
import { AnswerRepository } from "../../recoveryPassword/repository/AnswerRepository";
import { AnswerService } from "../../recoveryPassword/service/AnswerService";
import { UserController } from "../controller/UserController";
import upload from "../../../multerConfig"


const userRouter: Router = Router();
const questionRepository = new QuestionRepository();
const questionService = new QuestionService(questionRepository);
const answerRepository = new AnswerRepository();
const answerService = new AnswerService(answerRepository);

const userRepository = new UserRepository();
const userQuestionsAnswersRepository = new UserQuestionsAnswersRepository();
const userQuestionsAnswersService = new UserQuestionsAnswersService(
  userQuestionsAnswersRepository,
  questionService,
  answerService
);
const userService = new UserService(
  userRepository,
  userQuestionsAnswersService
);
const userController = new UserController(userService);


userRouter.get("/users", authMiddleware, (req, res, next) =>
  userController.getAllUsers(req, res, next)
);

userRouter.post(
  "/users",
  authMiddleware,
  upload.single("image"),
  (req, res, next) => userController.createUser(req, res, next)
);

userRouter.put("/users/:userId", upload.single("image"), (req, res, next) =>
  userController.updateUser(req, res, next)
);

userRouter.patch("/users/delete-user", authMiddleware, (req, res, next) =>
  userController.softDeleteUser(req, res, next)
);
export default userRouter;
