import mongoose from "mongoose";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";

export interface IBookingRepository {
  createDB(
    dto: any,
    session: mongoose.ClientSession
  ): Promise<IBooking>;
  createWithTransaction(
    createBookingFn: (session?: mongoose.ClientSession) => Promise<BookingVo>
  ): Promise<BookingVo>;

  // mapToVo(bookingDoc: IBooking): BookingVo;
}
