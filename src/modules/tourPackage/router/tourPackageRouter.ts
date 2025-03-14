import { Router } from "express";
import { TourPackageController } from "../controller/TourPackageController";
import { TourPackageRepository } from "../repository/TourPackageRepository";
import { TourPackgeService } from "../service/TourPackageService";

const tourPackageRouter = Router();

const tourPackageRepository = new TourPackageRepository();
const tourPackageService = new TourPackgeService(tourPackageRepository);
const tourPackageController = new TourPackageController(tourPackageService);

tourPackageRouter.post("/tour-package", (req, res, next) =>
  tourPackageController.createTourPackage(req, res, next)
);

tourPackageRouter.get("/tour-package", (req, res, next) =>
  tourPackageController.getAllTourPackages(req, res, next)
);

export default tourPackageRouter;
