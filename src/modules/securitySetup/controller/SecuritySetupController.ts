import { NextFunction, Request, Response } from "express";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { ISecuritySetupService } from "../service/ISecuritySetupService";
import { UpdatePasswordDto } from "../dto/updatePasswodDto";

export class SecuritySetupController {
  private readonly securitySetupService: ISecuritySetupService;

  constructor(securitySetupService: ISecuritySetupService) {
    this.securitySetupService = securitySetupService;
  }

  async updateUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // console.log("req.body::: ", req.body);
      const updatePasswordDto = UpdatePasswordDto.parse(req.body);
      await this.securitySetupService.updateUserPassword(updatePasswordDto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setMessage("Password actualizado exitosamente")
        .setData(null)
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      // const response = new ApiResponseBuilder()
      //   .setStatusCode(StatusCodes.INTERNAL_SERVER_ERROR)
      //   .setMessage("Error updating user password")
      //   .build();
      // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
      next(error);
    }
  }
}
