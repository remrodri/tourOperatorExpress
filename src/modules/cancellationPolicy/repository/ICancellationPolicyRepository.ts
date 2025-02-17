import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { ICancellationPolicy } from "../model/ICancellationPolicy";

export interface ICancellationPolicyRepository {
  updateDB(
    id: string,
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null>;
  findByIdDB(id: string): Promise<boolean>;
  softDeleteDB(id: string): Promise<ICancellationPolicy | null>;
  createCancellationPolicyDB(
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null>;
  getAllCancellationPolicyDB(): Promise<ICancellationPolicy[]>;
}
