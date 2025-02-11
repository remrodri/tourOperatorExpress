import { CreateCancellationPolicyDto } from "../dto/CreateCancellationPolicyDto";


export interface ICancellationPolicyService {
  createCancellationPolicyService(
    dto: CreateCancellationPolicyDto
  ): Promise<any>;
}
