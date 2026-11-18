import { BookingVo } from "../vo/BookingVo";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { ClientSession } from "mongoose";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { BookingVoV2 } from "../vo/BookingVoV2";
import { BookingUpdatedAttendanceVo } from "../vo/BookingUpdatedAttendanceVo";
import { UpdateBookingAttendanceListsDto } from '../dto/UpdateBookingAttendanceListsDto';
import { IBooking } from "../model/IBooking";
import { CancelBookingDto } from '../dto/CancelBookingDto';
import {
  BookingDateRangeSummaryQueryDto,
  BookingFeedQueryDto,
} from "../dto/BookingFeedQueryDto";
import { TouristVo } from "../../tourist/vo/TouristVo";

export interface IBookingService {
  getById(id: string, session?: ClientSession): Promise<BookingVo>;
  updateAllData(dto: UpdateAllDataBookingDto,id:string): Promise<BookingUpdatedVo>;
  update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo>;
  getAll(): Promise<BookingVoV2[]>;
  getFeed(dto: BookingFeedQueryDto): Promise<{
    items: BookingVoV2[];
    pagination: { nextCursor: string | null; hasMore: boolean };
  }>;
  getDetail(id: string): Promise<{
    booking: BookingVoV2;
    tourists: TouristVo[];
  }>;
  getReportSummary(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    years: number[];
    byTourPackageMonth: {
      tourPackageId: string;
      year: number;
      month: number;
      count: number;
      totalAmount: number;
    }[];
    bySellerTourPackage: {
      sellerId: string;
      tourPackageId: string;
      count: number;
    }[];
    daily: { date: string; count: number }[];
  }>;
  getDateRangeSummary(
    dto: BookingDateRangeSummaryQueryDto
  ): Promise<{ bookingCount: number; touristCount: number }>;
  createAllData(dto: CreateBookingDto): Promise<BookingCreatedVo>;
  updateBookingAttendanceLists(dto: UpdateBookingAttendanceListsDto): Promise<any[]>;
  cancelBooking(id:string,dto: CancelBookingDto): Promise<BookingUpdatedVo>;
}
