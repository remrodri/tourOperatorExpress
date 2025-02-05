import { NextFunction, Request, Response } from "express";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeService } from "../service/ITourTypeService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class TourTypeController {
  private readonly tourTypeService: ITourTypeService;

  constructor(tourTypeService: ITourTypeService) {
    this.tourTypeService = tourTypeService;
  }

  async updateTourType(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log("req.body::: ", req.body);
    const { id } = req.params;
    // console.log('id::: ', id);
    const dto = CreateTourTypeDto.parse(req.body);
    // console.log('dto::: ', dto);
    const tourTypeUpdated = await this.tourTypeService.updateTourType(dto, id);
    const response = new ApiResponseBuilder()
      .setStatusCode(StatusCodes.OK)
      .setData(tourTypeUpdated)
      .setMessage("tourType updated successfully")
      .build();
    res.status(StatusCodes.OK).json(response);
  }

  async createTourType(req: Request, res: Response, next: NextFunction) {
    // console.log("req.body::: ", req.body);
    try {
      const dto = CreateTourTypeDto.parse(req.body);
      const tourType = await this.tourTypeService.createTourType(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Tour Type creado exitosamente")
        .setData(tourType)
        .build();
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAllTourTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.tourTypeService.getAllTourTypes();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Tour Types encontrados satisfactoriamente")
        .setData(users)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
