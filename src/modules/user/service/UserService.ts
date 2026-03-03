import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
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

  constructor(
    userRepository: IUserRepository,
    userQuestionsAnswersService: IUserQuestionsAnswersService,
  ) {
    this.userRepository = userRepository;
    this.userQuestionsAnswersService = userQuestionsAnswersService;
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private toUserVo(user: any): UserVo {
    return new UserVo({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      ci: user.ci,
      email: user.email,
      firstLogin: user.firstLogin,
      role: user.role?.toString?.() ?? String(user.role),
      address: user.address ?? "",
      imageUrl: user.imagePath
        ? `${process.env.BASE_URL}${user.imagePath}`
        : "",
      deleted: user.deleted ?? false,
    });
  }

  private normalizeCreatePayload(payload: any) {
    return {
      ...payload,
      firstName: String(payload.firstName ?? "").trim(),
      lastName: String(payload.lastName ?? "").trim(),
      address: String(payload.address ?? "").trim(),
      phone: String(payload.phone ?? "").trim(),
      ci: String(payload.ci ?? "")
        .trim()
        .toUpperCase(),
      email: String(payload.email ?? "")
        .trim()
        .toLowerCase(),

      // ✅ unificación imagen: tu controller manda "image"
      // guardamos siempre como imagePath
      imagePath: payload.imagePath ?? payload.image ?? "",
    };
  }

  private normalizeUpdateDto(dto: UpdateUserDto) {
    return {
      ...dto,
      firstName: dto.firstName ? String(dto.firstName).trim() : dto.firstName,
      lastName: dto.lastName ? String(dto.lastName).trim() : dto.lastName,
      address: dto.address ? String(dto.address).trim() : dto.address,
      phone: dto.phone ? String(dto.phone).trim() : dto.phone,
      ci: dto.ci ? String(dto.ci).trim().toUpperCase() : dto.ci,
      email: dto.email ? String(dto.email).trim().toLowerCase() : dto.email,
      imagePath: dto.imagePath ?? "",
    };
  }

  private ensureRequiredForCreate(payload: any) {
    const required = [
      "firstName",
      "lastName",
      "email",
      "ci",
      "phone",
      "role",
      "address",
      "imagePath",
    ];
    const missing = required.filter(
      (k) => !payload[k] || String(payload[k]).trim() === "",
    );
    if (missing.length) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        `Faltan campos obligatorios: ${missing.join(", ")}`,
      );
    }
  }

  private async findByIdOrThrow(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user)
      throw new HttpException(StatusCodes.NOT_FOUND, "Usuario no encontrado");
    return user;
  }

  // -----------------------------
  // Enable / Disable (FIX imagen)
  // -----------------------------
  async enableUser(dto: DeleteUserDto): Promise<UserVo | null> {
    await this.findByIdOrThrow(dto.userId);

    // ✅ NO uses {...user}; solo cambia deleted
    const updated = await this.userRepository.update(dto.userId, {
      deleted: false,
    });

    if (!updated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "No se pudo habilitar el usuario",
      );
    }

    return this.toUserVo(updated);
  }

  async disableUser(dto: DeleteUserDto): Promise<UserVo | null> {
    await this.findByIdOrThrow(dto.userId);

    // ✅ NO uses {...user}; solo cambia deleted
    const updated = await this.userRepository.update(dto.userId, {
      deleted: true,
    });

    if (!updated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "No se pudo deshabilitar el usuario",
      );
    }

    return this.toUserVo(updated);
  }

  // -----------------------------
  // Getters
  // -----------------------------
  async getUserById(userId: string): Promise<any | null> {
    return await this.findByIdOrThrow(userId);
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user)
      throw new HttpException(StatusCodes.NOT_FOUND, "Usuario no encontrado");
    return user;
  }

  async getUserQuestionsAnswersIdByEmail(
    dto: GetRandomQuestionDto,
  ): Promise<string | null> {
    const email = String(dto.email ?? "")
      .trim()
      .toLowerCase();
    const userFound = await this.userRepository.findByEmail(email);
    if (!userFound)
      throw new HttpException(StatusCodes.NOT_FOUND, "El Usuario no existe");
    return userFound.questionsAnswers.toString();
  }

  async updateFirstLogin(userId: string): Promise<IUser | null> {
    await this.findByIdOrThrow(userId);
    return this.userRepository.updateFirstLogin(userId);
  }

  // -----------------------------
  // Soft delete
  // -----------------------------
  async softDeleteUser(dto: DeleteUserDto): Promise<UserVo | null> {
    await this.findByIdOrThrow(dto.userId);

    const deleted = await this.userRepository.softDeleteUser(dto);
    if (!deleted) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "El usuario no ha sido eliminado",
      );
    }
    return this.toUserVo(deleted);
  }

  // -----------------------------
  // UPDATE (con unicidad email/ci + mantener imagen)
  // -----------------------------
  async updateUser(
    updateUserDto: UpdateUserDto,
    userId: string,
  ): Promise<UserVo | null> {
    const userFound = await this.findByIdOrThrow(userId);

    const dto = this.normalizeUpdateDto(updateUserDto);

    // ✅ Mantener imagen si no viene nueva (tu controller manda "" cuando no hay file)
    if (!dto.imagePath || dto.imagePath === "") {
      dto.imagePath = userFound.imagePath;
    }

    // ✅ Unicidad email (solo si cambió)
    if (dto.email && dto.email !== userFound.email) {
      const userWithSameEmail = await this.userRepository.findByEmail(
        dto.email,
      );
      if (userWithSameEmail && userWithSameEmail._id.toString() !== userId) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El correo electrónico ya está registrado",
        );
      }
    }

    // ✅ Unicidad CI (solo si cambió)
    if (dto.ci && dto.ci !== userFound.ci) {
      const userWithSameCi = await this.userRepository.findByCi(dto.ci);
      if (userWithSameCi && userWithSameCi._id.toString() !== userId) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El CI ya está registrado",
        );
      }
    }

    const updated = await this.userRepository.updateUserData(
      {
        ...dto,
        // si no vienen, conserva los actuales
        email: dto.email ?? userFound.email,
        ci: dto.ci ?? userFound.ci,
      },
      userId,
    );

    if (!updated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al actualizar el usuario",
      );
    }

    return this.toUserVo(updated);
  }

  // -----------------------------
  // CREATE (con controles + imagePath consistente)
  // -----------------------------
  async createUser(userDataWithImage: any): Promise<UserVo> {
    const payload = this.normalizeCreatePayload(userDataWithImage);

    // ✅ obligatorios (incluye imagePath)
    this.ensureRequiredForCreate(payload);

    payload.firstLogin = true;
    payload.deleted = false;

    // ✅ email único
    const userByEmail = await this.userRepository.findByEmail(payload.email);
    if (userByEmail) {
      if (userByEmail.deleted) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El usuario ya existe pero está deshabilitado (puedes habilitarlo)",
        );
      }
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "El correo ya está registrado",
      );
    }

    // ✅ CI único
    const userByCi = await this.userRepository.findByCi(payload.ci);
    if (userByCi) {
      if (userByCi.deleted) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El CI ya existe pero el usuario está deshabilitado (puedes habilitarlo)",
        );
      }
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "El CI ya está registrado",
      );
    }

    // ✅ rol válido
    const roleOk = await this.userRepository.roleExists(payload.role);
    if (!roleOk) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "Rol inválido");
    }

    // ✅ crear usuario (asegúrate que el repo guarde imagePath)
    const newUser = await this.userRepository.createUser(payload);

    // ✅ crear preguntas de seguridad
    const questionsAnswersId =
      await this.userQuestionsAnswersService.createUserQuestionsAnswers(
        newUser._id.toString(),
      );

    const userUpdated = await this.userRepository.registerUserQuestionsAnswers(
      newUser._id.toString(),
      questionsAnswersId,
    );

    if (!userUpdated) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "No se registraron las preguntas de seguridad",
      );
    }

    return this.toUserVo(userUpdated);
  }

  // -----------------------------
  // GET ALL
  // -----------------------------
  async getAllUsers(): Promise<any[]> {
    const users = await this.userRepository.getAll();
    return users.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      ci: user.ci,
      email: user.email,
      firstLogin: user.firstLogin,
      role: user.role?.toString?.() ?? user.role,
      address: user.address ?? "",
      imageUrl: user.imagePath
        ? `${process.env.BASE_URL}${user.imagePath}`
        : "",
      deleted: user.deleted ?? false,
    }));
  }
}
