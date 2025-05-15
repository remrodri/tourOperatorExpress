import mongoose from "mongoose";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";

export interface IBookingRepository {
  getByIdDB(id: string, session?: mongoose.ClientSession): Promise<IBooking>;
  updateDB(
    id: string,
    updateData: mongoose.UpdateQuery<IBooking>,
    session?: mongoose.ClientSession
  ): Promise<IBooking>;
  getAllDB(): Promise<IBooking[]>;
  createDB(dto: any, session: mongoose.ClientSession): Promise<IBooking>;
  createWithTransaction(
    createBookingFn: (session?: mongoose.ClientSession) => Promise<BookingVo>
  ): Promise<BookingVo>;
  createWithTransaction2(
    createBookingFn: (session?: mongoose.ClientSession) => Promise<BookingCreatedVo>
  ): Promise<BookingCreatedVo>;

  // mapToVo(bookingDoc: IBooking): BookingVo;
}
