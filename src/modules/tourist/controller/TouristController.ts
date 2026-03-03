import { NextFunction, Request, Response } from "express";
import { ITouristService } from "../service/ITouristService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateTouristSchema } from "../dto/UpdateTouristDto";

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
