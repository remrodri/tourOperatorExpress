import { NextFunction, Request, Response } from "express";
import { ITouristService } from "../service/ITouristService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateTouristSchema } from "../dto/UpdateTouristDto";
import {
  TouristFeedQuerySchema,
  TouristIdsQuerySchema,
} from "../dto/TouristFeedQueryDto";

export class TouristController {
  private readonly touristService: ITouristService;

  constructor(touristService: ITouristService) {
    this.touristService = touristService;
  }

  async getAllTourists(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.touristService.getAll();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("Tourists found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTouristFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = TouristFeedQuerySchema.parse(req.query);
      const data = await this.touristService.getFeed(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(data)
        .setMessage("Tourists found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTouristsByIds(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = TouristIdsQuerySchema.parse(req.query);
      const data = await this.touristService.getByIds(ids);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(data)
        .setMessage("Tourists found successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTouristsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await this.touristService.count();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData({ total })
        .setMessage("Tourists counted successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateTourist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      console.log("req::: ", req.body);
      const dto = UpdateTouristSchema.parse(req.body);
      const vo = await this.touristService.updateTourist(id, dto);
      // const vo = await this.touristService.update(
      //   req.params.id,
      //   req.body,
      //   req.session
      // );
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("Tourist updated successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
