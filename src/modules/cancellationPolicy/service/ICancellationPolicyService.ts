import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";
import { CancellationPolicyVo } from "../vo/CancellationPolicyVo";

export interface ICancellationPolicyService {
  createCancellationPolicyService(
    dto: CreateCancellationPolicyDto
  ): Promise<any>;
  getAllCancellationPolicy(): Promise<CancellationPolicyVo[]>;
}
