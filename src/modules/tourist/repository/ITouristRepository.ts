import mongoose from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTourist";

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
