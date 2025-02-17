import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { CancellationPolicyModel } from "../model/cancellationPolicyModel";
import { ICancellationPolicy } from "../model/ICancellationPolicy";
import { ICancellationPolicyRepository } from "./ICancellationPolicyRepository";

export class CancellationPolicyRepository
  implements ICancellationPolicyRepository
{
  async updateDB(
    id: string,
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null> {
    return await CancellationPolicyModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async findByIdDB(id: string): Promise<boolean> {
    return Boolean(await CancellationPolicyModel.findById(id));
  }
  async softDeleteDB(id: string): Promise<ICancellationPolicy | null> {
    return await CancellationPolicyModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );
  }

  async getAllCancellationPolicyDB(): Promise<ICancellationPolicy[]> {
    return await CancellationPolicyModel.find({ deleted: false }).exec();
  }
  async createCancellationPolicyDB(
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null> {
    const cancellationPolicy = new CancellationPolicyModel({
      name: dto.name,
      deadLine: dto.deadLine,
      refoundPercentage: dto.refoundPercentage,
      description: dto.description,
    });
    return await cancellationPolicy.save();
  }
}
