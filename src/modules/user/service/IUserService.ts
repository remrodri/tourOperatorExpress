import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { CreateUserDto } from "../dto/createUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { UserVo } from "../vo/userVo";
import { DeleteUserDto } from "../dto/deleteUserDto";
import { GetRandomQuestionDto } from "../../securitySetup/dto/getRandomQuestionDto";
import { IUser } from "../model/IUser";

export interface IUserService {
  getAllUsers(): Promise<any[]>;
  // createUser(createUserDto: CreateUserDto): Promise<UserVo>;
  createUser(userDataWithImage:any): Promise<UserVo>;
  updateUser(updateUserDto: UpdateUserDto, userId: string): Promise<UserVo | null>;
  softDeleteUser(deleteUserDto: DeleteUserDto): Promise<UserVo | null>;
  updateFirstLogin(userId: string): Promise<IUser | null>;
  getUserQuestionsAnswersIdByEmail(
    getRandomQuestionDto: GetRandomQuestionDto
  ): Promise<string | null>;
  // registerUserQuestionsAnswers(userId:string,userQuestionsAnswersId: string): Promise<UserVo|null>;
  findUserByEmail(email: string): Promise<any | null>;
  getUserById(userId: string): Promise<any | null>;
}
