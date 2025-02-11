import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { ICancellationPolicyRepository } from "../repository/ICancellationPolicyRepository";
import { ICancellationPolicyService } from "./ICancellationPolicyService";
import { StatusCodes } from "http-status-codes";
import { CancellationPolicyVo } from "../vo/CancellationPolicyVo";
import { HttpException } from "../../../middleware/httpException";

export class CancellationPolicyService implements ICancellationPolicyService {
  private readonly cancellationPolicyRepository: ICancellationPolicyRepository;

  constructor(cancellationPolicyRepository: ICancellationPolicyRepository) {
    this.cancellationPolicyRepository = cancellationPolicyRepository;
  }

  async createCancellationPolicyService(
    dto: CreateCancellationPolicyDto
  ): Promise<any> {
    const response =
      await this.cancellationPolicyRepository.createCancellationPolicyDB(dto);
    if (!response) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error interno del servidor"
      );
    }
    const vo = new CancellationPolicyVo(
      response._id.toString(),
      response.name,
      response.deadLine,
      response.refoundPercentage,
      response.description
    );
    return vo;
  }
}
