import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { CreateUserMapper } from "../../../utils/mapper/createUserMapper";
import { userMapper } from "../../../utils/mapper/userMapper";
import { UserRequestDto } from "../../auth/dto/userRequestDto";
import { UserResponseDto } from "../../auth/dto/userResponseDto";
import { IUser } from "../../model/user/IUser";
import { UserModel } from "../../model/user/userModel";
// import { IRecoveryPasswordService } from "../../recoveryPassword/service/IRecoveryPasswordService";
import { IUserQuestionsAnswersService } from "../../recoveryPassword/service/IUserQuestionsAnswersService";
import { CreateUserDto } from "../dto/createUserDto";
import { UpdateUserDto } from "../dto/updateUserDto";
import { IUserRepository } from "../repository/IUserRepository";
import { UserVo } from "../vo/userVo";
import { IUserService } from "./IUserService";
import bcrypt from "bcryptjs";

export class UserService implements IUserService {
  private readonly userRepository: IUserRepository;
  private readonly userQuestionsAnswersService: IUserQuestionsAnswersService;
  // private readonly recoveryPasswordService: IRecoveryPasswordService;

  constructor(
    userRepository: IUserRepository,
    // recoveryPasswordService: IRecoveryPasswordService
    userQuestionsAnswersService: IUserQuestionsAnswersService
  ) {
    this.userRepository = userRepository;
    this.userQuestionsAnswersService = userQuestionsAnswersService;
    // this.recoveryPasswordService = recoveryPasswordService;
  }
  // registerUserQuestionsAnswers(userId: string, userQuestionsAnswersId: string): Promise<UserVo | null> {
  //   const userUpdated = this.userRepository.registerUserQuestionsAnswers()
  //   throw new Error("Method not implemented.");
  // }
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserVo | null> {
    throw new Error("Method not implemented.");
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserVo> {
    const userFound = await this.userRepository.findByEmail(
      createUserDto.email
    );
    // console.log("userFound::: ", userFound);
    if (userFound) {
      // throw new Error("El usuario con ese email ya existe");
      throw new HttpException(StatusCodes.BAD_REQUEST, "El usuario ya existe");
    }
    // const answerQuestions =
    //   await this.recoveryPasswordService.createUserQuestionsAnswers();
    const newUser = await this.userRepository.createUser(createUserDto);
    // console.log("newUser::: ", newUser);
    const userQuestionsAnswersId =
      await this.userQuestionsAnswersService.createUserQuestionsAnswers(
        newUser._id.toString()
      );
    // console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
    const userUpdated = await this.userRepository.registerUserQuestionsAnswers(
      newUser._id.toString(),
      userQuestionsAnswersId
    );
    if (!userUpdated) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "No se registraron las pregutnas de seguridad"
      );
    }
    const userVo = new UserVo(
      userUpdated._id.toString(),
      userUpdated.firstName,
      userUpdated.lastName,
      userUpdated.email,
      userUpdated.ci,
      userUpdated.phone,
      userUpdated.firstLogin,
      userUpdated.role
    );
    return userVo;
    // console.log("userUpdated::: ", userUpdated);
    // await this.recoveryPasswordService.createUserQuestionsAnswers(
    //   newUser._id.toString()
    // );

    // throw new Error("Method not implemented.");
  }

  async getAllUsers(): Promise<UserVo[]> {
    // throw new Error("Method not implemented.");
    const users = await this.userRepository.getAll();
    return users.map((user) => userMapper(user));
  }
}
