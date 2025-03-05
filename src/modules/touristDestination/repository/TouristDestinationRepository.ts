import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestination } from "../model/ITouristDestination";
import { TouristDestinationModel } from "../model/TouristDestinationModel";
import { ITouristDestinationRepository } from "./ITouristDestinationRepository";

export class TouristDestinationRepository
  implements ITouristDestinationRepository
{
  async updateDB(
    id: string,
    dto: TouristDestinationDto
  ): Promise<ITouristDestination | null> {
    return await TouristDestinationModel.findByIdAndUpdate(id, dto, {
      new: true,
    }).exec();
  }
  findByIdDB(id: string): Promise<ITouristDestination | null> {
    return TouristDestinationModel.findById(id).exec();
  }
  async getAllDB(): Promise<ITouristDestination[]> {
    return TouristDestinationModel.find().exec();
  }
  async createDB(
    dto: TouristDestinationDto
  ): Promise<ITouristDestination | null> {
    const touristDestination = new TouristDestinationModel(dto);
    return await touristDestination.save();
  }
}
