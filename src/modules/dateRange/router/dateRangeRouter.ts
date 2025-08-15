import { Router } from "express";
import { DateRangeRepository } from "../repository/DateRangeRepository";
import { DateRangeService } from "../service/DateRangeService";
import { DateRangeController } from "../controller/DateRangeController";

const dateRangeRouter = Router();

const dateRangeRepository = new DateRangeRepository();
const dateRangeService = new DateRangeService(dateRangeRepository);
const dateRangeController = new DateRangeController(dateRangeService);

dateRangeRouter.get("/date-range", (req, res, next) =>
  dateRangeController.getAllDateRange(req, res, next)
);

dateRangeRouter.put("/date-range/:id", (req, res, next) =>
  dateRangeController.updateDateRange(req, res, next)
);

export default dateRangeRouter;
