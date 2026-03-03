import { IUser } from "src/modules/user/model/IUser";

export interface IAuthRepository {
  findByEmail(email: string): Promise<IUser|null>;
}
