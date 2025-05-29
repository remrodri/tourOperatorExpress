import { BookingVo } from "../vo/BookingVo";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { ClientSession } from "mongoose";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";

export interface IBookingService {
  updateAllData(dto: UpdateAllDataBookingDto): Promise<BookingUpdatedVo>;
  update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo>;
  getAll(): Promise<BookingVo[]>;
  create(dto: CreateBookingDto): Promise<BookingVo>;
  createAllData(dto: CreateBookingDto): Promise<BookingCreatedVo>;
}
