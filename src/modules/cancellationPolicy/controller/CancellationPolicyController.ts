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
}
