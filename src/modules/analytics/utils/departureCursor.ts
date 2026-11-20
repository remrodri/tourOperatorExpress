import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { HttpException } from "../../../middleware/httpException";

export interface DepartureCursorValue {
  startDate: Date | null;
  id: Types.ObjectId;
}

const invalidCursor = () =>
  new HttpException(StatusCodes.BAD_REQUEST, "Cursor de paginación inválido");

export const encodeDepartureCursor = (
  startDate: Date | null,
  id: Types.ObjectId | string,
): string =>
  Buffer.from(
    JSON.stringify({
      startDate: startDate ? startDate.toISOString() : null,
      id: id.toString(),
    }),
    "utf8",
  ).toString("base64url");

export const decodeDepartureCursor = (
  cursor?: string,
): DepartureCursorValue | null => {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { startDate?: unknown; id?: unknown };

    if (
      (parsed.startDate !== null && typeof parsed.startDate !== "string") ||
      typeof parsed.id !== "string" ||
      !Types.ObjectId.isValid(parsed.id)
    ) {
      throw invalidCursor();
    }

    let startDate: Date | null = null;

    if (parsed.startDate !== null) {
      startDate = new Date(parsed.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw invalidCursor();
      }
    }

    return {
      startDate,
      id: new Types.ObjectId(parsed.id),
    };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throw invalidCursor();
  }
};

export const buildDepartureCursorFilter = (
  cursor: DepartureCursorValue | null,
): Record<string, unknown> => {
  if (!cursor) {
    return {};
  }

  if (cursor.startDate === null) {
    return {
      $or: [
        { startDate: null, _id: { $gt: cursor.id } },
        { startDate: { $ne: null } },
      ],
    };
  }

  return {
    $or: [
      { startDate: { $gt: cursor.startDate } },
      { startDate: cursor.startDate, _id: { $gt: cursor.id } },
    ],
  };
};
