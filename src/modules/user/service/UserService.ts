import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { userMapper } from "../../../utils/mapper/userMapper";
import { IUserQuestionsAnswersService } from "../../recoveryPassword/service/IUserQuestionsAnswersService";
import { UpdateUserDto } from "../dto/updateUserDto";
import { IUserRepository } from "../repository/IUserRepository";
import { UserVo } from "../vo/userVo";
import { IUserService } from "./IUserService";
import { DeleteUserDto } from "../dto/deleteUserDto";
import { GetRandomQuestionDto } from "../../securitySetup/dto/getRandomQuestionDto";
import { IUser } from "../model/IUser";

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
    console.log("email:::=> ", email);
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
      userUpdated.role,
      userUpdated.address,
      `${process.env.BASE_URL}${userUpdated.imagePath}`
    );
    return userVo;
    // throw new Error("Method not implemented.");
  }

  async createUser(userDataWithImage: any): Promise<any> {
    const userFound = await this.userRepository.findByEmail(
      userDataWithImage.email
    );
    if (userFound) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "El usuario ya existe");
    }
    // const answerQuestions =
    const newUser = await this.userRepository.createUser(userDataWithImage);
    const userQuestionsAnswersId =
      await this.userQuestionsAnswersService.createUserQuestionsAnswers(
        newUser._id.toString()
      );
    console.log("userQuestionsAnswersId::: ", userQuestionsAnswersId);
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
      userUpdated.phone,
      userUpdated.ci,
      userUpdated.email,
      userUpdated.firstLogin,
      userUpdated.role,
      userUpdated.address,
      `${process.env.BASE_URL}${userUpdated.imagePath}`
    );
    // return {
    //   ...userVo,
    //   imageUrl: userUpdated.imagePath
    //     ? `${process.env.BASE_URL}/uploads/perfilImage/${userUpdated.imagePath}`
    //     : null,
    // };
    return userVo;
  }

  async getAllUsers(): Promise<any[]> {
    // throw new Error("Method not implemented.");
    const users = await this.userRepository.getAll();
    const usersWithImageUrl = users.map((user) => {
      return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        ci: user.ci,
        email: user.email,
        firstLogin: user.firstLogin,
        role: user.role,
        address: user.address,
        imageUrl: user.imagePath
          ? `${process.env.BASE_URL}${user.imagePath}`
          : null,
      };
    });
    // return users.map((user) => userMapper(user));
    return usersWithImageUrl;
  }
}
