import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { ICancellationPolicy } from "../model/ICancellationPolicy";

export interface ICancellationPolicyRepository {
  createCancellationPolicyDB(
    dto: CreateCancellationPolicyDto
  ): Promise<ICancellationPolicy | null>;
}
