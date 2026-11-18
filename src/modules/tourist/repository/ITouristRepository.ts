import mongoose from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTouristDto";
import { CursorValue } from "../../../utils/pagination/cursorPagination";

export interface ITouristRepository {
  updateWithoutSessionDB(
    id: string,
    tourist: Partial<UpdateTouristDto>
  ): Promise<ITourist | null>;
  getByIdDB(id: string): Promise<ITourist | null>;
  updateDB(
    id: string,
    tourist: Partial<UpdateTouristDto>,
    session?: mongoose.ClientSession
  ): Promise<ITourist | null>;
  getAllDB(): Promise<ITourist[]>;
  getFeedDB(
    filter: Record<string, unknown>,
    cursor: CursorValue | null,
    limit: number
  ): Promise<ITourist[]>;
  getByIdsDB(ids: string[]): Promise<ITourist[]>;
  countDB(): Promise<number>;
  addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<ITourist | null>;
  createDB(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<ITourist>;
  findByEmail(email: string): Promise<ITourist | null>;
}
