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
  async update(
    id: string,
    dto: CreateCancellationPolicyDto
  ): Promise<CancellationPolicyVo> {
    console.log('dto::: ', dto);
    try {
      const cpFound = await this.cancellationPolicyRepository.findByIdDB(id);
      if (!cpFound) {
        throw new HttpException(StatusCodes.NOT_FOUND, "Not found");
      }
      const cpUpdated = await this.cancellationPolicyRepository.updateDB(
        id,
        dto
      );
      if (!cpUpdated) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error updating"
        );
      }
      const response = new CancellationPolicyVo(
        cpUpdated._id.toString(),
        cpUpdated.name,
        cpUpdated.deadLine,
        cpUpdated.refoundPercentage,
        cpUpdated.description
      );
      return response;
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
  async softDelete(id: string): Promise<CancellationPolicyVo> {
    try {
      const cancellationPolicyFound =
        await this.cancellationPolicyRepository.softDeleteDB(id);
      if (!cancellationPolicyFound) {
        throw new HttpException(StatusCodes.NOT_FOUND, "Not found");
      }
      const deleted = await this.cancellationPolicyRepository.softDeleteDB(id);
      if (!deleted) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error interno del servidor"
        );
      }
      const vo = new CancellationPolicyVo(
        deleted._id.toString(),
        deleted.name,
        deleted.deadLine,
        deleted.refoundPercentage,
        deleted.description
      );
      return vo;
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error interno del servidor"
      );
    }

    // throw new Error("Method not implemented.");
  }
  async getAllCancellationPolicy(): Promise<CancellationPolicyVo[]> {
    const response =
      await this.cancellationPolicyRepository.getAllCancellationPolicyDB();
    if (!response) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Cancellationpolicy no encontrados"
      );
    }
    const vos = response.map(
      (cancellationPolicy) =>
        new CancellationPolicyVo(
          cancellationPolicy._id.toString(),
          cancellationPolicy.name,
          cancellationPolicy.deadLine,
          cancellationPolicy.refoundPercentage,
          cancellationPolicy.description
        )
    );
    return vos;
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
