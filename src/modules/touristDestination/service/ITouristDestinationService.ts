import { TouristDestinationDto } from "../dto/TouristDestinationDto";

export interface ITouristDestinationService {
  createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<any>;
}
