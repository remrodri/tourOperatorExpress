import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { AnalyticsOverviewQuerySchema } from "../dto/AnalyticsOverviewQueryDto";
import { IAnalyticsService } from "../service/IAnalyticsService";

export class AnalyticsController {
  private readonly analyticsService: IAnalyticsService;

  constructor(analyticsService: IAnalyticsService) {
    this.analyticsService = analyticsService;
  }

  async getOverview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filters = AnalyticsOverviewQuerySchema.parse(req.query);
      const foundation = await this.analyticsService.getOverview(filters);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Analytics foundation retrieved successfully")
        .setData(foundation.data)
        .build();

      res.status(StatusCodes.OK).json({
        ...response,
        meta: foundation.meta,
        warnings: foundation.warnings,
      });
    } catch (error) {
      next(error);
    }
  }
}
