import { ITourType } from "src/modules/tourType/model/tourType/ITourType";
import { HttpException } from "../../../middleware/httpException";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeRepository } from "../repository/ITourTypeRepository";
import { TourTypeVo } from "../vo/TourTypeVo";
import { ITourTypeService } from "./ITourTypeService";
import { StatusCodes } from "http-status-codes";

export class TourTypeService implements ITourTypeService {
  private readonly tourTypeRepository: ITourTypeRepository;

  constructor(tourTypeRepository: ITourTypeRepository) {
    this.tourTypeRepository = tourTypeRepository;
  }
  async softDelete(id: string): Promise<TourTypeVo> {
    // console.log("id::: ", id);
    const tourTypeFound = this.tourTypeRepository.findById(id);
    if (!tourTypeFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "tourType not found");
    }
    const tourTypeDeleted = await this.tourTypeRepository.softDelete(id);
    // console.log('tourTypeDeleted::: ', tourTypeDeleted);
    if (!tourTypeDeleted) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error deleting tourType"
      );
    }
    const vo = new TourTypeVo(
      tourTypeDeleted.id.toString(),
      tourTypeDeleted.name,
      tourTypeDeleted.description
    );
    return vo;
  }

  async updateTourType(
    dto: CreateTourTypeDto,
    id: string
  ): Promise<TourTypeVo> {
    try {
      // console.log("id::: ", id);
      // console.log("dto::: ", dto);
      const tourTypeFound = await this.tourTypeRepository.findById(id);
      if (!tourTypeFound) {
        throw new HttpException(StatusCodes.NOT_FOUND, "tourType not found");
      }
      const tourTypeUpdated = await this.tourTypeRepository.updateTourType(
        dto,
        id
      );
      if (!tourTypeUpdated) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error updating tourType"
        );
      }
      // console.log("tourTypeFound::: ", tourTypeFound);
      // throw new Error("Method not implemented.");
      const response = new TourTypeVo(
        tourTypeUpdated._id.toString(),
        tourTypeUpdated.name,
        tourTypeUpdated.description
      );
      return response;
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error en el servidor"
      );
    }
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
  async getAllTourTypes(): Promise<any> {
    const tourTypes: ITourType[] =
      await this.tourTypeRepository.getAllTourTypes();
    if (!tourTypes) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Tour Types no encontrados"
      );
    }
    const vos = tourTypes.map(
      (tourType) =>
        new TourTypeVo(
          tourType._id.toString(),
          tourType.name,
          tourType.description
        )
    );
    return vos;
  }
}
