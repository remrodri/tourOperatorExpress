import { CreateUserMapper } from "../../../utils/mapper/createUserMapper";
import { IUser } from "../../model/user/IUser";
import { CreateUserDto } from "../dto/createUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";

export interface IUserRepository {
  getAll(): Promise<IUser[]>;
  findByEmail(email: string): Promise<IUser | null>;
  createUser(createUser: CreateUserDto): Promise<IUser>;
  updateUser(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<IUser | null>;
  registerUserQuestionsAnswers(userId:string,userQuestionsAnswersId: string): Promise<IUser|null>;
}
