import { NextFunction, Request, Response } from "express";
import { TourPackageDto } from "../dto/TourPackageDto";
import { ITourPackageService } from "../service/ITourPackageService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { HttpException } from "src/middleware/httpException";
import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { UpdateTourPackageDto } from "../dto/UpdateTourPackageDto";

export class TourPackageController {
  private readonly tourPackageService: ITourPackageService;

  constructor(tourPackageService: ITourPackageService) {
    this.tourPackageService = tourPackageService;
  }

  async deleteTourPackage(req: Request, res: Response, next: NextFunction) {
    try {
      // const { id } = req.params;
      const dto = DeleteTourPackageDto.parse(req.params);
      const vo = await this.tourPackageService.delete(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Deleted succesfully")
        .setData(vo)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateTourPackage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log("req.body::: ", req.body);
    try {
      const { id } = req.params;
      const dto = UpdateTourPackageDto.parse(req.body);
      // console.log("dto::: ", dto);
      const vo = await this.tourPackageService.update(id, dto);
      // console.log('vo::: ', vo);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("Updated successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
  async getAllTourPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.tourPackageService.getAllTourPackages();
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

  async getAllTourPackagesWithDateRangesInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.tourPackageService.getAllTourPackagesWithDateRangesInfo();
      // vos.forEach((vo) => console.log("vo.dateRanges::: ", vo.dateRanges));
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
      // console.log("req.body::: ", req.body);
      const dto = TourPackageDto.parse(req.body);
      // console.log('dto::: ', dto);
      // console.log('dto::: ', dto);
      const vo = await this.tourPackageService.createAllData(dto);
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
