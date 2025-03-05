import { NextFunction, Request, Response } from "express";
import { ITouristDestinationService } from "../service/ITouristDestinationService";
import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateTouristDestinationDto } from "../dto/updateTouristDestinationDto";
import { DeleteTouristDestinationDto } from "../dto/deleteTouristDestinationDto";

export class TouristDestinationController {
  private readonly touristDestinationService: ITouristDestinationService;

  constructor(touristDestinationService: ITouristDestinationService) {
    this.touristDestinationService = touristDestinationService;
  }

  async deleteTorusitDestination(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // const { id } = req.params;
      const dto = DeleteTouristDestinationDto.parse(req.params);
      const vo =
        await this.touristDestinationService.softDeleteTouristDestination(dto);
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
  async updateTouristDestination(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { name, description, existingImages } = req.body;
      const newImages = req.files as Express.Multer.File[];

      // const parsedData = TouristDestinationDto.parse({ name, description });
      const dto = UpdateTouristDestinationDto.parse({ name, description });
      console.log("dto::: ", dto);
      const vo = await this.touristDestinationService.updateTouristDestination(
        id,
        dto,
        existingImages ? JSON.parse(existingImages) : [],
        newImages
      );
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("TouristDestination successfully updated")
        .setData(vo)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAllTouristDestination(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // console.log("::: getall");
    try {
      const vos =
        await this.touristDestinationService.getAllTouristDestinations();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("TouristDestinations found")
        .setData(vos)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createTouristDestination(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsedBody = JSON.parse(JSON.stringify(req.body));
      const dto = TouristDestinationDto.parse(parsedBody);
      // console.log("dto::: ", dto);

      const vo = await this.touristDestinationService.createTouristDestination(
        dto,
        req.files as Express.Multer.File[]
      );
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("TouristDestination created")
        .setData(vo)
        .build();
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }
}
