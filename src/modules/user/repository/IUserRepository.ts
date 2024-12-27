import { IUser } from "../../model/user/IUser";
import { CreateUserDto } from "../dto/createUserDto";
import { DeleteUserDto } from "../dto/deleteUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";

export interface IUserRepository {
  getAll(): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  createUser(createUser: CreateUserDto): Promise<IUser>;
  updateUserQuestionsAnswers(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<IUser | null>;
  registerUserQuestionsAnswers(
    userId: string,
    userQuestionsAnswersId: string
  ): Promise<IUser | null>;
  updateUserData(userData: UpdateUserDto): Promise<IUser | null>;
  findById(userId: string): Promise<IUser | null>;
  softDeleteUser(deleteUserDto: DeleteUserDto): Promise<IUser | null>;
  updateFirstLogin(userId: string): Promise<IUser | null>;
  // getByEmail(email: string): Promise<IUser | null>;
}
