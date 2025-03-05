import { Router } from "express";
import { TouristDestinationController } from "../controller/TouristDestinationController";
import upload from "../../../multerTouristDestinations";
import { TouristDestinationService } from "../service/TouristDestinationService";
import { TouristDestinationRepository } from "../repository/TouristDestinationRepository";

const touristDestinationRepository = new TouristDestinationRepository();
const touristDestinationService = new TouristDestinationService(
  touristDestinationRepository
);
const touristDestinationController = new TouristDestinationController(
  touristDestinationService
);

const touristDestinationRouter = Router();

touristDestinationRouter.get("/tourist-destination", (req, res, next) =>
  touristDestinationController.getAllTouristDestination(req, res, next)
);

touristDestinationRouter.post(
  "/tourist-destination",
  upload.array("newImages", 5), // Ahora funciona sin parámetros adicionales
  (req, res, next) =>
    touristDestinationController.createTouristDestination(req, res, next)
);

touristDestinationRouter.put(
  "/tourist-destination/:id",
  upload.array("newImages", 5),
  (req, res, next) =>
    touristDestinationController.updateTouristDestination(req, res, next)
);

export default touristDestinationRouter;
