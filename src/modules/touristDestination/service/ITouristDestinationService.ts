import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { UpdateTouristDestinationDto } from "../dto/UpdateTouristDestinationDto";
// import { DeletedTouristDestinationVo } from "../vo/deletedTouristDestinationVo";
import { TouristDestinationVo } from "../vo/TouristDestinationVo";

export interface ITouristDestinationService {
  // softDeleteTouristDestination(
  //   dto:DeletedTouristDestinationVo
  // ):Promise<DeletedTouristDestinationVo>
  updateTouristDestination(
    id: string,
    dto: UpdateTouristDestinationDto,
    // existingImages:string[],
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo>;
  getAllTouristDestinations(): Promise<TouristDestinationVo[]>;
  createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo>;
  findByIdDB(id: string): Promise<TouristDestinationVo>;
}
