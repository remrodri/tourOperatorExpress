import { NextFunction, Request, Response } from "express";
import { IDateRangeService } from "../service/IDateRangeService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateDateRangeDto } from "../dto/UpdateDateRangeDto";
import { DateRangeDto } from "../dto/DateRangeDto";

export class DateRangeController {
  private readonly dateRangeService: IDateRangeService;

  constructor(dateRangeService: IDateRangeService) {
    this.dateRangeService = dateRangeService;
  }
  async getAllDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.dateRangeService.getAll();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("Date ranges found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
  async updateDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = UpdateDateRangeDto.parse(req.body);
      const vos = await this.dateRangeService.updateDateRange(req.params.id, dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("Date ranges found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = DateRangeDto.parse(req.body);
      const vos = await this.dateRangeService.create(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("Date ranges found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
