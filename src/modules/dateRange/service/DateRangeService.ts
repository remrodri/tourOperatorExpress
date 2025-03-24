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
  async getAll(): Promise<DateRangeVo[]> {
    const dateRanges = await this.dateRangeRepository.getAllDB();
    const vos = dateRanges.map(
      (dr: IDateRange) => new DateRangeVo(dr._id.toString(), dr.dates, dr.state)
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
      response.state
    );
    return vo;
  }
  async update(id: string, dto: DateRangeDto): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated = await this.dateRangeRepository.updateDB(id, dto);
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }
    return new DateRangeVo(
      drUpdated._id.toString(),
      drUpdated.dates,
      drUpdated.state
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
      drFound.state
    );
  }
}
