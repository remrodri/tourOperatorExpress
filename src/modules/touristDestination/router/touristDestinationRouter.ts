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

touristDestinationRouter.post(
  "/tourist-destination",
  upload.array("newImages", 5), // Ahora funciona sin parámetros adicionales
  (req, res, next) =>
    touristDestinationController.createTouristDestination(req, res, next)
);

export default touristDestinationRouter;
