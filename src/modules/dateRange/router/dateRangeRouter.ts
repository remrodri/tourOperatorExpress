import { Router } from "express";
import { DateRangeRepository } from "../repository/DateRangeRepository";
import { DateRangeService } from "../service/DateRangeService";
import { DateRangeController } from "../controller/DateRangeController";
import { TourPackageService } from "src/modules/tourPackage/service/TourPackageService";
import { TourPackageRepository } from "src/modules/tourPackage/repository/TourPackageRepository";
import { container } from "../../../shared/container";

const dateRangeRouter = Router();

// const dateRangeRepository = new DateRangeRepository();
// const tourPackageRepository = new TourPackageRepository();
// const tourPackageService = new TourPackageService(tourPackageRepository);
// const dateRangeService = new DateRangeService(dateRangeRepository,tourPackageService);
// const dateRangeController = new DateRangeController(dateRangeService);

const dateRangeController: DateRangeController = container.get('dateRangeController');

dateRangeRouter.get("/date-range", (req, res, next) =>
  dateRangeController.getAllDateRange(req, res, next)
);

dateRangeRouter.put("/date-range/:id", (req, res, next) =>
  dateRangeController.updateDateRange(req, res, next)
);

dateRangeRouter.post("/date-range", (req, res, next) =>
  dateRangeController.createDateRange(req, res, next)
);
export default dateRangeRouter;
