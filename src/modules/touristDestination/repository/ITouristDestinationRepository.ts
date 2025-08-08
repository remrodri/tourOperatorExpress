// import { DeleteTouristDestinationDto } from "../dto/DeleteTouristDestinationDto";
import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestination } from "../model/ITouristDestination";

export interface ITouristDestinationRepository {
  // softDeleteDB(
  //   dto: DeleteTouristDestinationDto
  // ): Promise<ITouristDestination | null>;
  updateDB(
    id: string,
    dto: TouristDestinationDto
  ): Promise<ITouristDestination | null>;
  findByIdDB(id: string): Promise<ITouristDestination | null>;
  createDB(dto: TouristDestinationDto): Promise<ITouristDestination | null>;
  getAllDB(): Promise<ITouristDestination[]>;
}
