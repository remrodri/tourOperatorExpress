import { IUser } from "../../model/user/IUser";
import { UserModel } from "../../model/user/userModel";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { ISecuritySetupRepository } from "./ISecuritySetupRepository";
import bcrypt from "bcryptjs";

export class SecuritySetupRepository implements ISecuritySetupRepository {
  async findUserById(userId: string): Promise<IUser | null> {
    return await UserModel.findById(userId);
  }
  async updatePassword(
    updatePasswodDto: UpdatePasswordDto
  ): Promise<IUser | null> {
    // console.log("updatePasswodDto::: ", updatePasswodDto);
    const passwordToUpdate = await bcrypt.hash(
      updatePasswodDto.newPassword,
      10
    );
    // console.log('passwordToUpdate::: ', passwordToUpdate);
    const user = await UserModel.findByIdAndUpdate(
      updatePasswodDto.userId,
      {
        password: passwordToUpdate,
      },
      { new: true }
    );
    // console.log('user::: ', user);
    return user;
  }
}
