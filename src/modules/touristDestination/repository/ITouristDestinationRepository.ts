import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestination } from "../model/ITouristDestination";

export interface ITouristDestinationRepository {
  createDB(dto: TouristDestinationDto): Promise<ITouristDestination | null>;
  getAllDB(): Promise<ITouristDestination[]>;
}
