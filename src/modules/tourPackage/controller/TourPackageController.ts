import { NextFunction, Request, Response } from "express";
import { TourPackageDto } from "../dto/CreateTourPackageDto";
import { ITourPackageService } from "../service/ITourPackageService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class TourPackageController {
  private readonly tourPackageService: ITourPackageService;

  constructor(tourPackageService: ITourPackageService) {
    this.tourPackageService = tourPackageService;
  }

  async getAllTourPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.tourPackageService.getAllTourPackages();
      // console.log('vos::: ', vos);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Tour packages found succesfully")
        .setData(vos)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createTourPackage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = TourPackageDto.parse(req.body);
      // console.log('dto::: ', dto);
      const vo = await this.tourPackageService.createTourPackage(dto);
      // console.log('vo::: ', vo);

      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Created successfully")
        .setData(vo)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
