import { Router } from "express";

import { container } from "../../../shared/container";
import { PaymentController } from "../controller/PaymentController";

const paymentRouter = Router();

const paymentController: PaymentController = container.get('paymentController');

paymentRouter.get("/payments", (req, res, next) =>
  paymentController.getAllPayments(req, res, next)
);

paymentRouter.post("/payments", (req, res, next) =>
  paymentController.createPayment(req, res, next)
);

export default paymentRouter;
