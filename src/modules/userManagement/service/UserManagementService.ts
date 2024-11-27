import { userMapper } from "../../../utils/mapper/userMapper";
import { UserRequestDto } from "../../auth/dto/userRequestDto";
import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { IUser } from "../../model/user/IUser";
import { IUserManagementRepository } from "../repository/IUserManagementRepository";
import { UserVo } from "../vo/userVo";
import { IUserManagementService } from "./IUserManagementService";

export class UserManamentService implements IUserManagementService {
  private readonly userManagementRepository: IUserManagementRepository;

  constructor(userManagementRepository: IUserManagementRepository) {
    this.userManagementRepository = userManagementRepository;
  }
  async getAllUsers(): Promise<UserVo[]> {
    // throw new Error("Method not implemented.");
    const users = await this.userManagementRepository.getAll();
    return users.map((user) => userMapper(user));
  }
}
