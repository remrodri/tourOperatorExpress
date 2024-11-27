import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { UserVo } from "../vo/userVo";

export interface IUserManagementService {
  getAllUsers(): Promise<UserVo[]>;
}
