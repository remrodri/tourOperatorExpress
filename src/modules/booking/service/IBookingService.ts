import { BookingVo } from "../vo/BookingVo";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { ClientSession } from "mongoose";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { BookingVoV2 } from "../vo/BookingVoV2";

export interface IBookingService {
  getById(id: string, session?: ClientSession): Promise<BookingVo>;
  updateAllData(dto: UpdateAllDataBookingDto,id:string): Promise<BookingUpdatedVo>;
  update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo>;
  getAll(): Promise<BookingVoV2[]>;
  createAllData(dto: CreateBookingDto): Promise<BookingCreatedVo>;
}
