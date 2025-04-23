import mongoose from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";

export interface ITouristRepository {
  addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<void>;
  createDB(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<ITourist>;
  findByEmail(email: string): Promise<ITourist | null>;
}
