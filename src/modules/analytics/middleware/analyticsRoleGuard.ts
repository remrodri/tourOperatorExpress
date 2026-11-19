import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { HttpException } from "../../../middleware/httpException";
import { RoleModel } from "../../role/model/roleModel";
import { ANALYTICS_ALLOWED_ROLES } from "../types/AnalyticsTypes";

const isAllowedRole = (roleName: string): boolean =>
  (ANALYTICS_ALLOWED_ROLES as readonly string[]).includes(roleName);

export const analyticsRoleGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = req.user as JwtPayload | undefined;
    const roleId = payload?.role;

    if (typeof roleId !== "string" || !Types.ObjectId.isValid(roleId)) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        "No tienes permisos para acceder al módulo de analítica",
      );
    }

    const role = await RoleModel.findById(roleId).select({ name: 1 }).lean();

    if (!role || !isAllowedRole(role.name)) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        "No tienes permisos para acceder al módulo de analítica",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
