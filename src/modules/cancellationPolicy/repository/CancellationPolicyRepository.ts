import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { CancellationPolicyModel } from "../model/cancellationPolicyModel";
import { ICancellationPolicy } from "../model/ICancellationPolicy";
import { ICancellationPolicyRepository } from "./ICancellationPolicyRepository";

export class CancellationPolicyRepository
  implements ICancellationPolicyRepository
{
  async createCancellationPolicyDB(
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null> {
    const cancellationPolicy = new CancellationPolicyModel({
      name: dto.name,
      deadLine: dto.deadLine,
      refoundPercentage: dto.refoundPercentage,
      description: dto.refoundPercentage,
    });
    return await cancellationPolicy.save();
  }
}
