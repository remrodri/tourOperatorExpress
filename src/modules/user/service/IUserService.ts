import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { IUser } from "../../model/user/IUser";
import { CreateUserDto } from "../dto/createUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { UserVo } from "../vo/userVo";

export interface IUserService {
  getAllUsers(): Promise<UserVo[]>;
  createUser(createUserDto: CreateUserDto): Promise<UserVo>;
  updateUser(
    updateUserDto: UpdateUserDto
  ): Promise<UserVo | null>;
  // registerUserQuestionsAnswers(userId:string,userQuestionsAnswersId: string): Promise<UserVo|null>;
}
