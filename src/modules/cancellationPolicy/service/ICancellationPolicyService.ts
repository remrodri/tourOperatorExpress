import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { CancellationPolicyVo } from "../vo/CancellationPolicyVo";

export interface ICancellationPolicyService {
  update(
    id: string,
    dto: CreateCancellationPolicyDto
  ): Promise<CancellationPolicyVo>;
  softDelete(id: String): Promise<CancellationPolicyVo>;
  createCancellationPolicyService(
    dto: CreateCancellationPolicyDto
  ): Promise<any>;
  getAllCancellationPolicy(): Promise<CancellationPolicyVo[]>;
}
