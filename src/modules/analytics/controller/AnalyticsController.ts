import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { AnalyticsDepartureParamsSchema } from "../dto/AnalyticsDepartureParamsDto";
import { AnalyticsDeparturesQuerySchema } from "../dto/AnalyticsDeparturesQueryDto";
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

  async getSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filters = AnalyticsOverviewQuerySchema.parse(req.query);
      const summary = await this.analyticsService.getSummary(filters);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Analytics summary retrieved successfully")
        .setData(summary.data)
        .build();

      res.status(StatusCodes.OK).json({
        ...response,
        meta: summary.meta,
        warnings: summary.warnings,
      });
    } catch (error) {
      next(error);
    }
  }

  async listDepartures(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filters = AnalyticsDeparturesQuerySchema.parse(req.query);
      const departures = await this.analyticsService.listDepartures(filters);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Analytics departures retrieved successfully")
        .setData(departures.data)
        .build();

      res.status(StatusCodes.OK).json({
        ...response,
        meta: departures.meta,
        warnings: departures.warnings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartureDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = AnalyticsDepartureParamsSchema.parse(req.params);
      const filters = AnalyticsOverviewQuerySchema.parse(req.query);
      const departure = await this.analyticsService.getDepartureDetail(
        params.id,
        filters,
      );
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Analytics departure detail retrieved successfully")
        .setData(departure.data)
        .build();

      res.status(StatusCodes.OK).json({
        ...response,
        meta: departure.meta,
        warnings: departure.warnings,
      });
    } catch (error) {
      next(error);
    }
  }
}
