import { ClientSession } from "mongoose";
import { HttpException } from "../../../middleware/httpException";
import { DateRangeDto } from "../dto/DateRangeDto";
import { IDateRange } from "../model/IDateRange";
import { IDateRangeRepository } from "../repository/IDateRangeRepository";
import { DateRangeVo } from "../vo/DateRangeVo";
import { IDateRangeService } from "./IDateRangeService";
import { StatusCodes } from "http-status-codes";

export class DateRangeService implements IDateRangeService {
  private readonly dateRangeRepository: IDateRangeRepository;

  constructor(dateRangeRepository: IDateRangeRepository) {
    this.dateRangeRepository = dateRangeRepository;
  }
  async addTourPackageIdToDateRange(id: string, tourPackageId: string, session?: ClientSession): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated = await this.dateRangeRepository.addTourPackageIdToDateRange(id, tourPackageId, session);
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
      const response = await this.dateRangeRepository.createDB(
        dto, 
        session
      );
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
      (dr: IDateRange) => new DateRangeVo(dr._id.toString(), dr.dates, dr.state,dr.guides,dr.tourPackageId)
    );
    return vos;
  }
  async create(dto: DateRangeDto): Promise<DateRangeVo> {
    const response = await this.dateRangeRepository.createDB(dto);
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
  }
  async update(id: string, dto: Partial<DateRangeDto>, session?: ClientSession): Promise<DateRangeVo> {
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
