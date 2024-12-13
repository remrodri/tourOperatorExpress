import { IUser } from "../../model/user/IUser";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";

export interface ISecuritySetupRepository {
  updatePassword(updatePasswodDto: UpdatePasswordDto): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
}
