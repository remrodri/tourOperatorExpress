import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { IUser } from "../../model/user/IUser";
import { CreateUserDto } from "../dto/createUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { UserVo } from "../vo/userVo";
import { DeleteUserDto } from "../dto/deleteUserDto";

export interface IUserService {
  getAllUsers(): Promise<UserVo[]>;
  createUser(createUserDto: CreateUserDto): Promise<UserVo>;
  updateUser(updateUserDto: UpdateUserDto): Promise<UserVo | null>;
  softDeleteUser(deleteUserDto: DeleteUserDto): Promise<UserVo|null>;
  // registerUserQuestionsAnswers(userId:string,userQuestionsAnswersId: string): Promise<UserVo|null>;
}
