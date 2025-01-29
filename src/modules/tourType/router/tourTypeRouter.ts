import { Router } from "express";
import { TourTypeController } from "../controller/TourTypeController";
import { TourTypeService } from "../service/tourTypeService";
import { TourTypeRepository } from "../repository/TourTypeRepository";


const tourTypeRouter = Router();

const tourTypeRepository = new TourTypeRepository();

const tourTypeService = new TourTypeService(tourTypeRepository);

const tourTypeController = new TourTypeController(tourTypeService);

tourTypeRouter.post("/tour-types", (req, res, next) =>
  tourTypeController.createTourType(req, res, next)
);

tourTypeRouter.get("/tour-types", (req, res, next) =>
  tourTypeController.getAllTourTypes(req, res, next)
);

export default tourTypeRouter;
