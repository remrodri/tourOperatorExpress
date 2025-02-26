import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { TouristDestinationVo } from "../vo/TouristDestinationVo";

export interface ITouristDestinationService {

  getAllTouristDestinations():Promise<TouristDestinationVo[]>
  createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo>;
}
