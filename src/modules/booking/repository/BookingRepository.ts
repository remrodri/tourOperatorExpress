import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { IBookingRepository } from "./IBookingRepository";
import { BookingModel } from "../model/BookingModel";
import mongoose, { QueryOptions } from "mongoose";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";

export class BookingRepository implements IBookingRepository {
  async getByIdDB(
    id: string,
    session?: mongoose.ClientSession
  ): Promise<IBooking> {
    const query = BookingModel.findById(id);
    if (session) {
      query.session(session);
    }
    const booking = await query.exec();

    if (!booking) {
      throw new Error(`Booking with id ${id} not found`);
    }
    return booking;
  }
  async updateDB(
    id: string,
    // updateData: Partial<CreateBookingDto>,
    updateData: Partial<UpdateBookingDto>,
    session?: mongoose.ClientSession
  ): Promise<IBooking> {
    const options: QueryOptions = { new: true };
    if (session) options["session"] = session;

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      id,
      updateData,
      options
    ).exec();

    if (!updatedBooking) {
      throw new Error(`Booking with id ${id} not found`);
    }
    return updatedBooking;
  }
  async getAllDB(): Promise<IBooking[]> {
    return await BookingModel.find().exec();
  }
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
