import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { UpdateTouristDestinationDto } from "../dto/updateTouristDestinationDto";
import { TouristDestinationVo } from "../vo/TouristDestinationVo";

export interface ITouristDestinationService {
  updateTouristDestination(
    id: string,
    dto: UpdateTouristDestinationDto,
    existingImages:string[],
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo>;
  getAllTouristDestinations(): Promise<TouristDestinationVo[]>;
  createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo>;
}
