import { IUser } from "../../model/user/IUser";
import { UserModel } from "../../model/user/userModel";
import { IAuthRepository } from "./IAuthRepository";

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email });
    console.log("user::: ", user);
    return user;
    // throw new Error("Method not implemented.");
  }
}
