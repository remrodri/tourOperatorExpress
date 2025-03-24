import { NextFunction, Request, Response } from "express";
import { IDateRangeService } from "../service/IDateRangeService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

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
}
