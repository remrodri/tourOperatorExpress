import { TouristVo } from "../vo/TouristVo";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import mongoose from "mongoose";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTouristDto";
import { ClientSession } from "mongoose";
import { TouristFeedQueryDto } from "../dto/TouristFeedQueryDto";

export interface ITouristService {
  getById(id: string): Promise<TouristVo | null>;
  update(
    id: string,
    tourist: UpdateTouristDto,
    session: ClientSession
  ): Promise<TouristVo | null>;
  getAll(): Promise<TouristVo[]>;
  getFeed(dto: TouristFeedQueryDto): Promise<{
    items: TouristVo[];
    pagination: { nextCursor: string | null; hasMore: boolean };
  }>;
  getByIds(ids: string[]): Promise<TouristVo[]>;
  count(): Promise<number>;
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
  updateTourist(id: string, tourist: UpdateTouristDto): Promise<TouristVo>;
}
