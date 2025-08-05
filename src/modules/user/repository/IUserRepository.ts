import { CreateUserDto } from "../dto/createUserDto";
import { DeleteUserDto } from "../dto/deleteUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { IUser } from "../model/IUser";

export interface IUserRepository {
  getAll(): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  createUser(userDataWithImage:any): Promise<IUser>;
  updateUserQuestionsAnswers(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<IUser | null>;
  registerUserQuestionsAnswers(
    userId: string,
    userQuestionsAnswersId: string
  ): Promise<IUser | null>;
  updateUserData(userData: UpdateUserDto, userId: string): Promise<IUser | null>;
  findById(userId: string): Promise<IUser | null>;
  softDeleteUser(deleteUserDto: DeleteUserDto): Promise<IUser | null>;
  updateFirstLogin(userId: string): Promise<IUser | null>;
  // getByEmail(email: string): Promise<IUser | null>;
}
