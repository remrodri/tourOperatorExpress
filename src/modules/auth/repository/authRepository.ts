
import { UserModel } from "../../user/model/userModel";
import { IAuthRepository } from "./IAuthRepository";
import { IUser } from "../../user/model/IUser";

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email });
    console.log("user::: ", user);
    return user;
    // throw new Error("Method not implemented.");
  }
}
