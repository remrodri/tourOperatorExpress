import { NextFunction, Request, Response } from "express";
import { ITouristDestinationService } from "../service/ITouristDestinationService";
import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class TouristDestinationController {
  private readonly touristDestinationService: ITouristDestinationService;

  constructor(touristDestinationService: ITouristDestinationService) {
    this.touristDestinationService = touristDestinationService;
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
