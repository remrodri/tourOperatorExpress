import { BookingVo } from "../vo/BookingVo";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { ClientSession } from "mongoose";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
export interface IBookingService {
  update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo>;
  getAll(): Promise<BookingVo[]>;
  create(dto: CreateBookingDto): Promise<BookingVo>;
  createAllData(dto: CreateBookingDto): Promise<BookingCreatedVo>;
}
