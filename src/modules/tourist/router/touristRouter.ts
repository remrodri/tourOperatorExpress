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
export default touristRouter;
