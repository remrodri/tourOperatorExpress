import { Router } from "express";
import { TourPackageController } from "../controller/TourPackageController";
import { TourPackageRepository } from "../repository/TourPackageRepository";
import { TourPackageService } from "../service/TourPackageService";
import { DateRangeService } from "../../dateRange/service/DateRangeService";
import { DateRangeRepository } from "../../dateRange/repository/DateRangeRepository";
import { container } from "../../../shared/container";

const tourPackageRouter = Router();

// const tourPackageRepository = new TourPackageRepository();
// const dateRangeRepository = new DateRangeRepository();
// const dateRangeService = new DateRangeService(dateRangeRepository);
// const tourPackageService = new TourPackageService(
//   tourPackageRepository,
//   dateRangeService
// );
// const tourPackageController = new TourPackageController(tourPackageService);

const tourPackageController: TourPackageController = container.get('tourPackageController');

tourPackageRouter.put("/tour-package/:id", (req, res, next) =>
  tourPackageController.updateTourPackage(req, res, next)
);

tourPackageRouter.put("/tour-package-status/:id", (req, res, next) =>
  tourPackageController.updateTourPackageStatus(req, res, next)
);

tourPackageRouter.post("/tour-package", (req, res, next) =>
  tourPackageController.createTourPackage(req, res, next)
);

// tourPackageRouter.get("/tour-package", (req, res, next) =>
//   tourPackageController.getAllTourPackages(req, res, next)
// );
tourPackageRouter.get("/tour-package", (req, res, next) =>
  tourPackageController.getAllTourPackagesWithDateRangesInfo(req, res, next)
);

tourPackageRouter.delete("/tour-package/:id", (req, res, next) =>
  tourPackageController.deleteTourPackage(req, res, next)
);



export default tourPackageRouter;
