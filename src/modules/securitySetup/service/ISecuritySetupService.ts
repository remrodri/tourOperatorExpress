import { UpdatePasswordDto } from "../dto/updatePasswodDto";

export interface ISecuritySetupService {
  updateUserPassword(updatePasswodDto:UpdatePasswordDto): Promise<void>;
}
