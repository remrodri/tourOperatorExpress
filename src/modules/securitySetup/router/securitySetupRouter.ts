import { Router } from "express";
import { SecuritySetupRepository } from "../repository/SecuritySetupRepository";
import { SecuritySetupService } from "../service/SecurityServiceService";
import { SecuritySetupController } from "../controller/SecuritySetupController";
import { authMiddleware } from "../../../middleware/authMiddleware";

const securitySetupRouter: Router = Router();

const securitySetupRepository = new SecuritySetupRepository();
const securitySetupService = new SecuritySetupService(securitySetupRepository);
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
  authMiddleware,
  (req, res, next) =>
    securitySetupController.getSecurityQuestions(req, res, next)
);

securitySetupRouter.patch(
  "/security-setup-answers",
  authMiddleware,
  (req, res, next) =>
    securitySetupController.updateSecurityAnswers(req, res, next)
);

export default securitySetupRouter;
