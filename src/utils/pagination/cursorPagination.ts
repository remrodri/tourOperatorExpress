import { Types } from "mongoose";
import { HttpException } from "../../middleware/httpException";
import { StatusCodes } from "http-status-codes";

export interface CursorValue {
  createdAt: Date;
  id: Types.ObjectId;
}

export const encodeCursor = (createdAt: Date, id: Types.ObjectId): string =>
  Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id: id.toString() }),
    "utf8"
  ).toString("base64url");

export const decodeCursor = (cursor?: string): CursorValue | null => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as { createdAt?: string; id?: string };

    if (!parsed.createdAt || !parsed.id || !Types.ObjectId.isValid(parsed.id)) {
      throw new Error("invalid cursor");
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("invalid cursor date");
    }

    return { createdAt, id: new Types.ObjectId(parsed.id) };
  } catch {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      "Cursor de paginación inválido"
    );
  }
};

export const buildCursorFilter = (
  cursor: CursorValue | null
): Record<string, unknown> => {
  if (!cursor) return {};

  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ],
  };
};
