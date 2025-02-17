import { Router } from "express";
import { CancellationPolicyController } from "../controller/CancellationPolicyController";
import { CancellationPolicyRepository } from "../repository/CancellationPolicyRepository";
import { CancellationPolicyService } from "../service/CancellationPolicyService";

const cancellationPolicyRepository = new CancellationPolicyRepository();
const cancellationPolicyService = new CancellationPolicyService(
  cancellationPolicyRepository
);
const cancellationPolicyController = new CancellationPolicyController(
  cancellationPolicyService
);

const cancellationPolicyRouter = Router();

cancellationPolicyRouter.put("/cancellation-policy/:id", (req, res, next) =>
  cancellationPolicyController.updateCancellationlPolicy(req, res, next)
);

cancellationPolicyRouter.delete("/cancellation-policy/:id", (req, res, next) =>
  cancellationPolicyController.deleteCancellationPolicy(req, res, next)
);

cancellationPolicyRouter.post("/cancellation-policy", (req, res, next) =>
  cancellationPolicyController.createCancellationPolicy(req, res, next)
);

cancellationPolicyRouter.get("/cancellation-policy", (req, res, next) =>
  cancellationPolicyController.getAllCancellationPolicy(req, res, next)
);

export default cancellationPolicyRouter;
