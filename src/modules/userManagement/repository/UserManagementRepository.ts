import { IUser } from "../../model/user/IUser";
import { UserModel } from "../../model/user/userModel";
import { IUserManagementRepository } from "./IUserManagementRepository";

export class UserManagementRepository implements IUserManagementRepository {
  async getAll(): Promise<IUser[]> {
    return await UserModel.find({ deleted: false });
    throw new Error("Method not implemented.");
  }
}
