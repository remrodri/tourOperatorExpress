import { TouristVo } from "../vo/TouristVo";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import mongoose from "mongoose";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTourist";
import { ClientSession } from 'mongoose';

export interface ITouristService {
  getById(id:string): Promise<TouristVo|null>;
  update(id:string,tourist: UpdateTouristDto,session:ClientSession): Promise<TouristVo|null>;
  getAll(): Promise<TouristVo[]>;
  addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<TouristVo>;
  create(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<TouristVo>;
  mapToVo(tourist: ITourist): TouristVo;
}
