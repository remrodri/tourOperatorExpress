import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestination } from "../model/ITouristDestination";
import { TouristDestinationModel } from "../model/TouristDestinationModel";
import { ITouristDestinationRepository } from "./ITouristDestinationRepository";

export class TouristDestinationRepository
  implements ITouristDestinationRepository
{
  async createDB(
    dto: TouristDestinationDto
  ): Promise<ITouristDestination | null> {
    const touristDestination = new TouristDestinationModel(dto);
    return await touristDestination.save();
  }
}
