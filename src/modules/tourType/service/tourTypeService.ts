import { HttpException } from "../../../middleware/httpException";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeRepository } from "../repository/ITourTypeRepository";
import { TourTypeVo } from "../vo/tourTypeVo";
import { ITourTypeService } from "./ITourTypeService";
import { StatusCodes } from "http-status-codes";

export class TourTypeService implements ITourTypeService {
  private readonly tourTypeRepository: ITourTypeRepository;

  constructor(tourTypeRepository: ITourTypeRepository) {
    this.tourTypeRepository = tourTypeRepository;
  }

  async createTourType(dto: CreateTourTypeDto): Promise<any> {
    // console.log('dto::: ', dto);
    const tourTypeFound = await this.tourTypeRepository.findByName(dto.name);
    if (tourTypeFound) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "Tour Type ya existe");
    }
    const newTourType = await this.tourTypeRepository.createTourType(dto);
    if (!newTourType) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "Tour Type no creado");
    }

    const vo = new TourTypeVo(
      newTourType._id.toString(),
      newTourType.name,
      newTourType.description
    );
    return vo;

    // console.log("newTourType::: ", newTourType);

    // throw new Error("Method not implemented.");
  }
}
