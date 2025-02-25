import { HttpException } from "../../../middleware/httpException";
import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestinationRepository } from "../repository/ITouristDestinationRepository";
import { TouristDestinationVo } from "../vo/TouristDestinationVo";
import { ITouristDestinationService } from "./ITouristDestinationService";
import { StatusCodes } from "http-status-codes";

export class TouristDestinationService implements ITouristDestinationService {
  private readonly touristDestinationRepository: ITouristDestinationRepository;

  constructor(touristDestinationRepository: ITouristDestinationRepository) {
    this.touristDestinationRepository = touristDestinationRepository;
  }

  async createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<any> {
    // console.log("dto::: ", dto);
    // console.log('files::: ', files);
    const images = files.map(
      (file) => `/uploads/destinations${dto.imageFolder}/${file.filename}`
    );
    dto.images = images;
    const response = await this.touristDestinationRepository.createDB(dto);
    if (!response) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
    // console.log('response::: ', response);
    const vo = new TouristDestinationVo(
      response._id.toString(),
      response.name,
      response.description,
      response.imageFolder,
      response.images,
      response.deleted
    );
    return vo;
    // throw new Error("Method not implemented.");
  }
}
