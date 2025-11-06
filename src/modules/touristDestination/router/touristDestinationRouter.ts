import { Router } from "express";
import { TouristDestinationController } from "../controller/TouristDestinationController";
// import upload from "../../../multerTouristDestinations";
import { TouristDestinationService } from "../service/TouristDestinationService";
import { TouristDestinationRepository } from "../repository/TouristDestinationRepository";
import { setImageFolder } from "../middleware/setImageFolder";
import { setImageFolderV2 } from "../middleware/setImageFolder";
import upload from "../middleware/upload";

const touristDestinationRepository = new TouristDestinationRepository();
const touristDestinationService = new TouristDestinationService(
  touristDestinationRepository
);
const touristDestinationController = new TouristDestinationController(
  touristDestinationService
);

const touristDestinationRouter = Router();

// touristDestinationRouter.delete("/tourist-destination/:id", (req, res, next) =>
//   touristDestinationController.deleteTorusitDestination(req, res, next)
// );
// const setImageFolder = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { id } = req.params;
//   const destination = await touristDestinationService.findByIdDB(id);
//   if (destination) {
//     req.body.imageFolder = destination.imageFolder;
//   } else {
//     req.body.imageFolder = uuidv4();
//   }
//   next();
// };

touristDestinationRouter.get("/tourist-destination", (req, res, next) =>
  touristDestinationController.getAllTouristDestination(req, res, next)
);

// touristDestinationRouter.post(
//   "/tourist-destination",
//   upload.array("newImages", 5),
//   (req, res, next) => {
//     console.log("req::: ", req.files);
//     next();
//   },
//   (req, res, next) =>
//     touristDestinationController.createTouristDestination(req, res, next),
// );

touristDestinationRouter.put(
  "/tourist-destination/:id",
  setImageFolder, // obtiene o crea imageFolder
  upload.array("newImages", 5), // multer usa ese imageFolder
  (req, res, next) =>
    touristDestinationController.updateTouristDestination(req, res, next)
);

touristDestinationRouter.post(
  "/tourist-destination",
  setImageFolderV2, // generar carpeta única
  upload.array("newImages", 5), // hasta 5 imágenes
  (req, res, next) =>
    touristDestinationController.createTouristDestination(req, res, next)
);

export default touristDestinationRouter;
