import { TouristVo } from "../vo/TouristVo";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import mongoose from "mongoose";
import { ITourist } from "../model/ITourist";

export interface ITouristService {
  addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<void>;
  create(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<TouristVo>;
  mapToVo(tourist: ITourist): TouristVo;
}
