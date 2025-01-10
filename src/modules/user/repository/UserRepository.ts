import { IUser } from "../../model/user/IUser";
import { UserModel } from "../../model/user/userModel";
// import { IRecoveryPasswordService } from "../../recoveryPassword/service/IRecoveryPasswordService";
import { CreateUserDto } from "../dto/createUserDto";
import { DeleteUserDto } from "../dto/deleteUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { IUserRepository } from "./IUserRepository";
import bcrypt from "bcryptjs";

export class UserRepository implements IUserRepository {
  // async getByEmail(email: string): Promise<IUser | null> {
  //   return await UserModel.findOne({ email: email });
  //   // throw new Error("Method not implemented.");
  // }
  async updateFirstLogin(userId: string): Promise<IUser | null> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        firstLogin: false,
      },
      { new: true }
    );
    return user;
    // throw new Error("Method not implemented.");
  }
  async softDeleteUser(deleteUserDto: DeleteUserDto): Promise<IUser | null> {
    return await UserModel.findByIdAndUpdate(
      deleteUserDto.userId,
      {
        deleted: true,
      },
      { new: true }
    );
    // throw new Error("Method not implemented.");
  }
  async findById(userId: string): Promise<IUser | null> {
    // console.log("userId de repo::: ", userId);
    return await UserModel.findById(userId);
    // throw new Error("Method not implemented.");
  }
  async updateUserData(userData: UpdateUserDto): Promise<IUser | null> {
    // console.log('userData::: ', userData);
    const user = await UserModel.findByIdAndUpdate(
      userData.userId,
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        ci: userData.ci,
        phone: userData.phone,
        role: userData.role,
        new: userData.address,
      },
      { new: true }
    );
    // console.log("user::: ", user);
    return user;
    // throw new Error("Method not implemented.");
  }
  async registerUserQuestionsAnswers(
    userId: string,
    userQuestionsAnswersId: string
  ): Promise<IUser | null> {
    console.log("userId::: ", userId);
    console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
    const userUpdated = await UserModel.findByIdAndUpdate(userId, {
      questionsAnswers: userQuestionsAnswersId,
    });
    return userUpdated;
    // throw new Error("Method not implemented.");
  }
  async updateUserQuestionsAnswers(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<IUser | null> {
    const userUpdated = await UserModel.findByIdAndUpdate(
      userId,
      updateUserDto,
      { new: true }
    );
    return userUpdated;
  }

  async createUser(newUser: CreateUserDto): Promise<IUser> {
    // console.log('newUser::: ', newUser);
    // console.log("newUserRepo::: ", newUser);
    // const user = new UserModel(newUser);
    const newPassword = await bcrypt.hash("123456", 10);
    // console.log("password::: ", password);
    const user = new UserModel({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      email: newUser.email,
      ci: newUser.ci,
      password: newPassword,
      role: newUser.role,
      address: newUser.address,
    });

    // console.log("user::: ", user);
    // this.recoveryPasswordRepository.createUserQuestionsAnswers(
    //   user._id.toString()
    // );
    // this.recoveryPasswordservice.createUserQuestionsAnswers(user._id.toString());
    return await user.save();
    // throw new Error("Method not implemented.");
  }
  async findByEmail(email: string): Promise<IUser | null> {
    console.log("email:::=>> ", email);
    const userFound = await UserModel.findOne({ email, deleted: false }).exec();
    console.log("userFound:::=>>> ", userFound);
    // return UserModel.findOne({ email, deleted: false }).exec();
    return userFound;
  }
  async getAll(): Promise<IUser[]> {
    return await UserModel.find({ deleted: false });
    // throw new Error("Method not implemented.");
  }
}
