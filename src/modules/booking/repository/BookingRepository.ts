import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { IBookingRepository } from "./IBookingRepository";
import { BookingModel } from "../model/BookingModel";
import { ClientSession, QueryOptions, startSession } from "mongoose";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingDto } from "../dto/BookingDto";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { BookingUpdatedAttendanceVo } from "../vo/BookingUpdatedAttendanceVo";

export class BookingRepository implements IBookingRepository {
  async updateBookingAttendanceLists(
    updateFn: (session: ClientSession) => Promise<BookingUpdatedAttendanceVo[]>
  ): Promise<BookingUpdatedAttendanceVo[]> {
    const session = await startSession();
    try {
      session.startTransaction({ writeConcern: { w: "majority" } });
  
      const updatedBookings = await updateFn(session);
  
      await session.commitTransaction();
      return updatedBookings;
    } catch (error) {
      console.error("Error durante la transacción:", error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  async updateWithTransaction(
    updateBookingFn: (session: ClientSession) => Promise<BookingUpdatedVo>
  ): Promise<BookingUpdatedVo> {
    const session = await startSession();
    try {
      session.startTransaction({
        writeConcern: { w: "majority" },
      });
  
      const booking = await updateBookingFn(session);
  
      await session.commitTransaction();
      return booking;
    } catch (error) {
      console.error("Error durante la transacción:", error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // async updateAllDataDB(dto: BookingDto): Promise<IBooking | null> {
  //   return await BookingModel.findByIdAndUpdate(dto.id, dto, { new: true }).exec();
  // }
  async getByIdDB(
    id: string,
    session?: ClientSession
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
    session?: ClientSession
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
    const bookings = await BookingModel.find().populate("paymentIds").exec();
    // console.log('bookings::: ', bookings);
    return bookings;
  }
  // private mapToVo(bookingDoc: IBooking): BookingVo {
  //   return {
  //   }
  //   throw new Error("Method not implemented.");
  // }
  async createDB(
    dto: any,
    session?: ClientSession
  ): Promise<IBooking> {
    const bookingModel = new BookingModel(dto);
    const savedBooking = session
      ? await bookingModel.save({ session })
      : await bookingModel.save();

    // console.log("bookingModel::: ", bookingModel);

    return savedBooking;
  }
  // async createWithTransaction(
  //   createBookingFn: (session: mongoose.ClientSession) => Promise<BookingVo>
  // ): Promise<BookingVo> {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   try {
  //     const booking = await createBookingFn(session);
  //     await session.commitTransaction();
  //     return booking;
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async createWithTransaction2(
    createBookingFn: (
      session: ClientSession
    ) => Promise<BookingCreatedVo>
  ): Promise<BookingCreatedVo> {
    const session = await startSession();
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
