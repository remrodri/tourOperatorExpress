import { StatusCodes } from "http-status-codes";
import { HttpException } from "../../../middleware/httpException";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";
import { ISecuritySetupRepository } from "../repository/ISecuritySetupRepository";
import { ISecuritySetupService } from "./ISecuritySetupService";

export class SecuritySetupService implements ISecuritySetupService {
  private readonly securitySetupRepository: ISecuritySetupRepository;

  constructor(securitySetupRepository: ISecuritySetupRepository) {
    this.securitySetupRepository = securitySetupRepository;
  }

  async updateUserPassword(updatePasswodDto: UpdatePasswordDto): Promise<void> {
    const user = await this.securitySetupRepository.findUserById(
      updatePasswodDto.userId
    );
    if (!user) {
      throw new HttpException(StatusCodes.BAD_REQUEST, "El usuario no existe");
    }
    const response = await this.securitySetupRepository.updatePassword(
      updatePasswodDto
    );
    if (!response) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "Nose actualizo el password"
      );
    }
    // console.log("response::: ", response);
    // throw new Error("Method not implemented.");
  }
}
