import { Router } from "express";
import { CancellationPolicyController } from "../controller/CancellationPolicyController";
import { CancellationPolicyService } from "../service/CancellationPolicyService";
import { CancellationPolicyRepository } from "../repository/CancellationPolicyRepository";

const cancellationPolicyRepository = new CancellationPolicyRepository();
const cancellationPolicyService = new CancellationPolicyService(
  cancellationPolicyRepository
);
const cancellationPolicyController = new CancellationPolicyController(
  cancellationPolicyService
);

const cancellationPolicyRouter = Router();

cancellationPolicyRouter.post("/cancellation-policy", (req, res, next) =>
  cancellationPolicyController.createCancellationPolicy(req, res, next)
);

export default cancellationPolicyRouter;
