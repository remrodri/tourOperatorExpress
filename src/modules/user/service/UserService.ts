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
import { DeleteUserDto } from "../dto/deleteUserDto";
import { GetRandomQuestionDto } from "../../securitySetup/dto/getRandomQuestionDto";

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

  async getUserById(userId: string): Promise<any | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User no existe");
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<any | null> {
    console.log('email:::=> ', email);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User no encontrado");
    }
    return user;
    // throw new Error("Method not implemented.");
  }
  async getUserQuestionsAnswersIdByEmail(
    getRandomQuestionDto: GetRandomQuestionDto
  ): Promise<string | null> {
    // console.log("entre::: ");
    const userFound = await this.userRepository.findByEmail(
      getRandomQuestionDto.email
    );
    if (!userFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El Usuario no existe");
    }
    return userFound.questionsAnswers.toString();
    // throw new Error("Method not implemented.");
  }
  // async getUserQuestionsAnswersByEmail(email: string): Promise<string | null> {
  //   const user = await this.userRepository.getByEmail(email);
  //   if (!user) {
  //     return null;
  //   }

  // throw new Error("Method not implemented.");
  // }
  async updateFirstLogin(userId: string): Promise<IUser | null> {
    const userFound = await this.userRepository.findById(userId);
    if (!userFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User no encontrado");
    }
    const user = this.userRepository.updateFirstLogin(userId);
    return user;
    // throw new Error("Method not implemented.");
  }
  async softDeleteUser(deleteUserDto: DeleteUserDto): Promise<UserVo | null> {
    const userFound = await this.userRepository.findById(deleteUserDto.userId);
    // console.log('userFound::: ', userFound);
    if (!userFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Usuario no encontrado");
    }
    const userSoftDeleted = await this.userRepository.softDeleteUser(
      deleteUserDto
    );
    if (!userSoftDeleted) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "El usuario no ha sido eliminado"
      );
    }
    // console.log('userSoftDeleted::: ', userSoftDeleted);
    const userVo = userMapper(userSoftDeleted);
    return userVo;
    // throw new Error("Method not implemented.");
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<UserVo | null> {
    // console.log('updateUserDto::: ', updateUserDto);
    const userFound = await this.userRepository.findByEmail(
      updateUserDto.email
    );
    if (!userFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Usuario no encontrado");
    }
    const userUpdated = await this.userRepository.updateUserData(updateUserDto);
    // console.log('userUpdated::: ', userUpdated);
    if (!userUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al actualizar el usuario"
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
    // throw new Error("Method not implemented.");
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
    console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
    // console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
    const userUpdated = await this.userRepository.registerUserQuestionsAnswers(
      newUser._id.toString(),
      userQuestionsAnswersId
    );
    if (!userUpdated) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "No se registraron las preguntas de seguridad"
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
