import { NextFunction, Request, Response } from "express";
import { ITouristService } from "../service/ITouristService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

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
}
