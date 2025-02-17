import { NextFunction, Request, Response } from "express";
import { ICancellationPolicyService } from "../service/ICancellationPolicyService";
import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class CancellationPolicyController {
  private readonly cancellationPolicyService: ICancellationPolicyService;

  constructor(cancellationPolicyService: ICancellationPolicyService) {
    this.cancellationPolicyService = cancellationPolicyService;
  }
  async updateCancellationlPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      console.log('req.body::: ', req.body);
      const dto = CreateCancellationPolicyDto.parse(req.body.values);
      console.log('dto::: ', dto);
      const vo = await this.cancellationPolicyService.update(id, dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("updated successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteCancellationPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.cancellationPolicyService.softDelete(id);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(deleted)
        .setMessage("Deleted succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createCancellationPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = CreateCancellationPolicyDto.parse(req.body);
      const vo =
        await this.cancellationPolicyService.createCancellationPolicyService(
          dto
        );
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("CancellationPolicy creado")
        .setData(vo)
        .build();
      res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAllCancellationPolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const vos =
        await this.cancellationPolicyService.getAllCancellationPolicy();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("CancellationPolicy found")
        .setData(vos)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
