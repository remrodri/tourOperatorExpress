import { Router } from "express";
import { TouristRepository } from "../repository/TouristRepository";
import { TouristService } from "../service/TouristService";
import { TouristController } from "../controller/TouristController";

const touristRouter = Router();

const touristRepository = new TouristRepository();
const touristService = new TouristService(touristRepository);
const touristController = new TouristController(touristService);

touristRouter.get("/tourists", (req, res, next) =>
  touristController.getAllTourists(req, res, next)
);

touristRouter.get("/tourists/feed", (req, res, next) =>
  touristController.getTouristFeed(req, res, next)
);

touristRouter.get("/tourists/by-ids", (req, res, next) =>
  touristController.getTouristsByIds(req, res, next)
);

touristRouter.get("/tourists/count", (req, res, next) =>
  touristController.getTouristsCount(req, res, next)
);

touristRouter.put("/tourists/:id", (req, res, next) =>
  touristController.updateTourist(req, res, next)
);
export default touristRouter;
