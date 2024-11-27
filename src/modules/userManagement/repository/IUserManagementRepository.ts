import { IUser } from "../../model/user/IUser";

export interface IUserManagementRepository {
  getAll(): Promise<IUser[]>;
}
