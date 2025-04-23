import mongoose, { ClientSession } from "mongoose";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { IBookingRepository } from "./IBookingRepository";
import { BookingModel } from "../model/BookingModel";

export class BookingRepository implements IBookingRepository {
  // private mapToVo(bookingDoc: IBooking): BookingVo {
  //   return {
  //   }
  //   throw new Error("Method not implemented.");
  // }
  async createDB(
    dto: any,
    session?: mongoose.ClientSession
  ): Promise<IBooking> {
    const bookingModel = new BookingModel(dto);
    const savedBooking = session
      ? await bookingModel.save({ session })
      : await bookingModel.save();
    
    // console.log("bookingModel::: ", bookingModel);

    return savedBooking;
  }
  async createWithTransaction(
    createBookingFn: (session: mongoose.ClientSession) => Promise<BookingVo>
  ): Promise<BookingVo> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await createBookingFn(session);
      await session.commitTransaction();
      return booking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
