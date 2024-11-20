import { IUser } from "../../model/user/IUser";

export interface IAuthRepository {
  findByEmail(email: string): Promise<IUser|null>;
}
