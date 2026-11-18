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
import {
  DateRangeBounds,
  DateRangeNormalizationError,
  resolveDateRangeBounds,
} from "../domain/dateRangeNormalization";

type DateRangeBoundsSource = {
  dates?: string[];
  startDate?: Date;
  endDate?: Date;
};

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

  private normalizeCreate(dto: DateRangeDto): DateRangeDto {
    try {
      const bounds = resolveDateRangeBounds({
        dates: dto.dates,
        startDate: dto.startDate,
        endDate: dto.endDate,
      });

      return { ...dto, ...bounds, dataOrigin: dto.dataOrigin ?? "manual" };
    } catch (error) {
      if (error instanceof DateRangeNormalizationError) {
        throw new HttpException(StatusCodes.BAD_REQUEST, error.message);
      }
      throw error;
    }
  }

  private normalizeUpdate<T extends DateRangeBoundsSource>(
    dto: T
  ): T & Partial<DateRangeBounds> {
    if (!dto.dates && !dto.startDate && !dto.endDate) {
      return dto;
    }

    try {
      return {
        ...dto,
        ...resolveDateRangeBounds({
          dates: dto.dates,
          startDate: dto.startDate,
          endDate: dto.endDate,
        }),
      };
    } catch (error) {
      if (error instanceof DateRangeNormalizationError) {
        throw new HttpException(StatusCodes.BAD_REQUEST, error.message);
      }
      throw error;
    }
  }

  async updateDateRange(
    id: string,
    dto: UpdateDateRangeDto
  ): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    const drUpdated = await this.dateRangeRepository.updateDateRangeDB(
      id,
      this.normalizeUpdate(dto)
    );
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }

    return DateRangeVo.fromDocument(drUpdated);
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
    return DateRangeVo.fromDocument(drUpdated);
  }
  async createWithSession(
    dto: DateRangeDto,
    session: ClientSession
  ): Promise<DateRangeVo> {
    try {
      const normalizedDto = this.normalizeCreate(dto);
      const response = await this.dateRangeRepository.createDB(
        normalizedDto,
        session
      );
      if (!response) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
      }
      return DateRangeVo.fromDocument(response);
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
    return dateRanges.map((dr: IDateRange) => DateRangeVo.fromDocument(dr));
  }
  async create(dto: DateRangeDto): Promise<DateRangeVo> {
    const dateRangeDoc = await this.dateRangeRepository.createDB(
      this.normalizeCreate(dto)
    );
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

    return DateRangeVo.fromDocument(dateRangeDoc);
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
    const drUpdated = await this.dateRangeRepository.updateDB(
      id,
      this.normalizeUpdate(dto),
      session
    );
    if (!drUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating DateRange"
      );
    }
    return DateRangeVo.fromDocument(drUpdated);
  }
  async findById(id: string): Promise<DateRangeVo> {
    const drFound = await this.dateRangeRepository.findByIdDB(id);
    if (!drFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "DateRange not found");
    }
    return DateRangeVo.fromDocument(drFound);
  }
}
