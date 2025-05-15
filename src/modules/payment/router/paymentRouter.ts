import { Router } from "express";

import { PaymentService } from "../service/PaymentService";
import { PaymentRepository } from "../repository/PaymentRepository";
import { PaymentController } from "../controller/PaymentController";

const paymentRouter = Router();

const paymentRepository = new PaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const paymentController = new PaymentController(paymentService);

paymentRouter.get("/payments", (req, res, next) =>
  paymentController.getAllPayments(req, res, next)
);

export default paymentRouter;
