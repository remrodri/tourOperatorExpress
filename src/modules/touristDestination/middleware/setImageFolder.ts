import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from "express";
import { TouristDestinationService } from "../service/TouristDestinationService";
import { TouristDestinationRepository } from "../repository/TouristDestinationRepository";

const touristDestinationRepository = new TouristDestinationRepository();
const touristDestinationService = new TouristDestinationService(
  touristDestinationRepository
);

export const setImageFolder = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (id) {
    // Es una actualización
    const destination = await touristDestinationService.findByIdDB(id);
    if (destination) {
      req.imageFolder = destination.imageFolder; // 👈 Guardamos aquí
    } else {
      req.imageFolder = uuidv4();
    }
  } else {
    // Creación
    req.imageFolder = uuidv4();
  }

  next();
};

export function setImageFolderV2(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.imageFolder = uuidv4(); // todas las imágenes de esta subida irán a la misma carpeta
  next();
}
