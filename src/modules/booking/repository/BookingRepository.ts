import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { IBookingRepository } from "./IBookingRepository";
import { BookingModel } from "../model/BookingModel";
import {
  ClientSession,
  QueryOptions,
  Types,
  startSession,
} from "mongoose";
import { CursorValue } from "../../../utils/pagination/cursorPagination";
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

  async getFeedDB(
    filter: Record<string, unknown>,
    cursor: CursorValue | null,
    limit: number
  ): Promise<IBooking[]> {
    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
          ],
        }
      : {};

    return BookingModel.find({ ...filter, ...cursorFilter })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("paymentIds")
      .lean()
      .exec() as unknown as Promise<IBooking[]>;
  }

  async getByIdDetailDB(id: string): Promise<IBooking | null> {
    return BookingModel.findById(id)
      .populate("paymentIds")
      .populate("touristsIds")
      .lean()
      .exec() as unknown as Promise<IBooking | null>;
  }

  async getReportSummaryDB(): Promise<{
    total: { totalBookings: number; totalRevenue: number }[];
    years: { _id: number }[];
    byTourPackageMonth: {
      tourPackageId: Types.ObjectId;
      year: number;
      month: number;
      count: number;
      totalAmount: number;
    }[];
    bySellerTourPackage: {
      sellerId: Types.ObjectId;
      tourPackageId: Types.ObjectId;
      count: number;
    }[];
    daily: { date: string; count: number }[];
  }> {
    const [result] = await BookingModel.aggregate([
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "cancelled"] },
                      "$cancellationFee",
                      "$totalPrice",
                    ],
                  },
                },
              },
            },
          ],
          years: [
            { $group: { _id: { $year: "$createdAt" } } },
            { $sort: { _id: 1 } },
          ],
          byTourPackageMonth: [
            {
              $group: {
                _id: {
                  tourPackageId: "$tourPackageId",
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
                totalAmount: { $sum: "$totalPrice" },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ],
          bySellerTourPackage: [
            {
              $group: {
                _id: {
                  sellerId: "$sellerId",
                  tourPackageId: "$tourPackageId",
                },
                count: { $sum: 1 },
              },
            },
          ],
          daily: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]).exec();

    return {
      total: result?.total ?? [],
      years: result?.years ?? [],
      byTourPackageMonth: (result?.byTourPackageMonth ?? []).map(
        (item: {
          _id: {
            tourPackageId: Types.ObjectId;
            year: number;
            month: number;
          };
          count: number;
          totalAmount: number;
        }) => ({
          tourPackageId: item._id.tourPackageId,
          year: item._id.year,
          month: item._id.month,
          count: item.count,
          totalAmount: item.totalAmount,
        })
      ),
      bySellerTourPackage: (result?.bySellerTourPackage ?? []).map(
        (item: {
          _id: { sellerId: Types.ObjectId; tourPackageId: Types.ObjectId };
          count: number;
        }) => ({
          sellerId: item._id.sellerId,
          tourPackageId: item._id.tourPackageId,
          count: item.count,
        })
      ),
      daily: (result?.daily ?? []).map(
        (item: { _id: string; count: number }) => ({
          date: item._id,
          count: item.count,
        })
      ),
    };
  }

  async getDateRangeSummaryDB(
    dateRangeId: string,
    tourPackageId?: string
  ): Promise<{ bookingCount: number; touristCount: number }> {
    const filter: Record<string, unknown> = {
      dateRangeId: new Types.ObjectId(dateRangeId),
    };
    if (tourPackageId) {
      filter.tourPackageId = new Types.ObjectId(tourPackageId);
    }

    const [result] = await BookingModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          bookingCount: { $sum: 1 },
          touristCount: {
            $sum: { $size: { $ifNull: ["$touristsIds", []] } },
          },
        },
      },
    ]).exec();

    return {
      bookingCount: result?.bookingCount ?? 0,
      touristCount: result?.touristCount ?? 0,
    };
  }
  // private mapToVo(bookingDoc: IBooking): BookingVo {
  //   return {
  //   }
  //   throw new Error("Method not implemented.");
  // }
  async createDB(
    dto: any,
    session?: ClientSession,
    bookingCode?: string
  ): Promise<IBooking> {
    const bookingModel = new BookingModel({...dto,bookingCode});
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
