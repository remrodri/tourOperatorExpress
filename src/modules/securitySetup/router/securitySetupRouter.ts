import { Router } from "express";
import { SecuritySetupRepository } from "../repository/SecuritySetupRepository";
import { SecuritySetupService } from "../service/SecuritySetupService";
import { SecuritySetupController } from "../controller/SecuritySetupController";
import { authMiddleware } from "../../../middleware/authMiddleware";
import { UserRepository } from "../../user/repository/UserRepository";
import { UserService } from "../../user/service/UserService";
import { UserQuestionsAnswersService } from "../../recoveryPassword/service/UserQuestionsAnswersService";
import { UserQuestionsAnswersRepository } from "../../recoveryPassword/repository/UserQuestionsAnswersRepository";
import { QuestionService } from "../../recoveryPassword/service/QuestionService";
import { AnswerService } from "../../recoveryPassword/service/AnswerService";
import { QuestionRepository } from "../../recoveryPassword/repository/QuestionRepository";
import { AnswerRepository } from "../../recoveryPassword/repository/AnswerRepository";

const securitySetupRouter: Router = Router();

const securitySetupRepository = new SecuritySetupRepository();
const userRepository = new UserRepository();
const userQuestionsAnswersRepository = new UserQuestionsAnswersRepository();
const questionRepository = new QuestionRepository();
const answerRepository = new AnswerRepository();
const answerService = new AnswerService(answerRepository);
const questionsService = new QuestionService(questionRepository);

const userQuestionsAnswersService = new UserQuestionsAnswersService(
  userQuestionsAnswersRepository,
  questionsService,
  answerService
);
const userService = new UserService(
  userRepository,
  userQuestionsAnswersService
);

const securitySetupService = new SecuritySetupService(
  securitySetupRepository,
  userService,
  userQuestionsAnswersService
);
const securitySetupController = new SecuritySetupController(
  securitySetupService
);

// securitySetupRouter.patch("/security-setup", authMiddleware, (req, res, next) =>
//   securitySetupController.updateUserPassword(req, res, next)
// );
securitySetupRouter.patch("/security-setup", authMiddleware, (req, res, next) =>
  securitySetupController.updateUserPassword(req, res, next)
);

securitySetupRouter.post(
  "/security-setup-questions",
  // authMiddleware,
  (req, res, next) =>
    securitySetupController.getSecurityQuestions(req, res, next)
);

securitySetupRouter.patch(
  "/security-setup-answers",
  // authMiddleware,
  (req, res, next) =>
    securitySetupController.updateSecurityAnswers(req, res, next)
);

securitySetupRouter.post(
  "/security-setup-question",
  // authMiddleware,
  (req, res, next) =>
    // securitySetupController.getRandomSecurityQuestion(req, res, next)
    securitySetupController.findUserByEmail(req, res, next)
);

securitySetupRouter.get(
  "/security-setup/random-question/:userId",
  (req, res, next) => securitySetupController.getRandomQuestion(req, res, next)
);

securitySetupRouter.post("/security-setup-answer", (req, res, next) =>
  securitySetupController.checkSecurityAnswer(req, res, next)
);

securitySetupRouter.patch("/security-setup-password", (req, res, next) =>
  securitySetupController.updateUserPassword(req, res, next)
);

export default securitySetupRouter;
