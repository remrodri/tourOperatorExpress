import mongoose from "mongoose";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBooking } from "../model/IBooking";
import { BookingVo } from "../vo/BookingVo";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingDto } from "../dto/BookingDto";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { BookingUpdatedAttendanceVo } from "../vo/BookingUpdatedAttendanceVo";
import { CursorValue } from "../../../utils/pagination/cursorPagination";

export interface IBookingRepository {
  updateBookingAttendanceLists(
    updateBookingFn: (session?: mongoose.ClientSession) => Promise<BookingUpdatedAttendanceVo[]>
  ): Promise<BookingUpdatedAttendanceVo[]>;
  updateWithTransaction(
    updateBookingFn: (session?: mongoose.ClientSession) => Promise<BookingUpdatedVo>
  ): Promise<BookingUpdatedVo>;
  // updateAllDataDB(dto: BookingDto): Promise<IBooking | null>;
  getByIdDB(id: string, session?: mongoose.ClientSession): Promise<IBooking>;
  updateDB(
    id: string,
    updateData: mongoose.UpdateQuery<IBooking>,
    session?: mongoose.ClientSession
  ): Promise<IBooking>;
  getAllDB(): Promise<IBooking[]>;
  getFeedDB(
    filter: Record<string, unknown>,
    cursor: CursorValue | null,
    limit: number
  ): Promise<IBooking[]>;
  getByIdDetailDB(id: string): Promise<IBooking | null>;
  getReportSummaryDB(): Promise<{
    total: { totalBookings: number; totalRevenue: number }[];
    years: { _id: number }[];
    byTourPackageMonth: {
      tourPackageId: mongoose.Types.ObjectId;
      year: number;
      month: number;
      count: number;
      totalAmount: number;
    }[];
    bySellerTourPackage: {
      sellerId: mongoose.Types.ObjectId;
      tourPackageId: mongoose.Types.ObjectId;
      count: number;
    }[];
    daily: { date: string; count: number }[];
  }>;
  getDateRangeSummaryDB(
    dateRangeId: string,
    tourPackageId?: string
  ): Promise<{ bookingCount: number; touristCount: number }>;
  createDB(dto: any, session: mongoose.ClientSession,bookingCode: string): Promise<IBooking>;
  // createWithTransaction(
  //   createBookingFn: (session?: mongoose.ClientSession) => Promise<BookingVo>
  // ): Promise<BookingVo>;
  createWithTransaction2(
    createBookingFn: (session?: mongoose.ClientSession) => Promise<BookingCreatedVo>
  ): Promise<BookingCreatedVo>;

  // mapToVo(bookingDoc: IBooking): BookingVo;
}
