import { ClientSession } from "mongoose";
import { HttpException } from "../../../middleware/httpException";
import { DateRangeDto } from "../dto/DateRangeDto";
import { IDateRange } from "../model/IDateRange";
import { IDateRangeRepository } from "../repository/IDateRangeRepository";
import { DateRangeVo } from "../vo/DateRangeVo";
import { IDateRangeService } from "./IDateRangeService";
import { StatusCodes } from "http-status-codes";
import { UpdateDateRangeDto } from "../dto/UpdateDateRangeDto";
import { ITourPackageService } from "src/modules/tourPackage/service/ITourPackageService";

export class DateRangeService implements IDateRangeService {
  private readonly dateRangeRepository: IDateRangeRepository;
  private readonly tourPackageService: ITourPackageService;

  constructor(
    dateRangeRepository: IDateRangeRepository,
    tourPackageService: ITourPackageService
  ) {
    this.dateRangeRepository = dateRangeRepository;
    this.tourPackageService = tourPackageService;
  }
  async updateDateRange(
    id: string,
    dto: UpdateDateRangeDto
  ): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated = await this.dateRangeRepository.updateDateRangeDB(id, dto);
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }

    return new DateRangeVo(
      drUpdated._id.toString(),
      drUpdated.dates,
      drUpdated.state,
      drUpdated.guides,
      drUpdated.tourPackageId
    );
  }
  async addTourPackageIdToDateRange(
    id: string,
    tourPackageId: string,
    session?: ClientSession
  ): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id, session);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated =
      await this.dateRangeRepository.addTourPackageIdToDateRange(
        id,
        tourPackageId,
        session
      );
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }
    return new DateRangeVo(
      drUpdated._id.toString(),
      drUpdated.dates,
      drUpdated.state,
      drUpdated.guides,
      drUpdated.tourPackageId
    );
  }
  async createWithSession(
    dto: DateRangeDto,
    session: ClientSession
  ): Promise<DateRangeVo> {
    try {
      // console.log('dto::: ', dto);
      const response = await this.dateRangeRepository.createDB(dto, session);
      console.log("response::: ", response);
      if (!response) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
      }
      const vo = new DateRangeVo(
        response._id.toString(),
        response.dates,
        response.state,
        response.guides,
        response.tourPackageId
      );
      return vo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
  async getAll(): Promise<DateRangeVo[]> {
    const dateRanges = await this.dateRangeRepository.getAllDB();
    const vos = dateRanges.map(
      (dr: IDateRange) =>
        new DateRangeVo(
          dr._id.toString(),
          dr.dates,
          dr.state,
          dr.guides,
          dr.tourPackageId
        )
    );
    return vos;
  }
  async create(dto: DateRangeDto): Promise<DateRangeVo> {
    const dateRangeDoc = await this.dateRangeRepository.createDB(dto);
    if (!dateRangeDoc) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
    const tourPackageDoc = await this.tourPackageService.findById(
      dateRangeDoc.tourPackageId
    );
    if (!tourPackageDoc) {
      throw new HttpException(StatusCodes.NOT_FOUND, "TourPackage not found");
    }

    await this.tourPackageService.addDateRangeToTourPackage(
      tourPackageDoc.id,
      dateRangeDoc._id.toString()
    );

    const vo = new DateRangeVo(
      dateRangeDoc._id.toString(),
      dateRangeDoc.dates,
      dateRangeDoc.state,
      dateRangeDoc.guides,
      dateRangeDoc.tourPackageId
    );
    return vo;
  }
  async update(
    id: string,
    dto: Partial<DateRangeDto>,
    session?: ClientSession
  ): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated = await this.dateRangeRepository.updateDB(id, dto, session);
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }
    return new DateRangeVo(
      drUpdated._id.toString(),
      drUpdated.dates,
      drUpdated.state,
      drUpdated.guides,
      drUpdated.tourPackageId
    );
  }
  async findById(id: string): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    return new DateRangeVo(
      drFound._id.toString(),
      drFound.dates,
      drFound.state,
      drFound.guides,
      drFound.tourPackageId
    );
  }
}
