import { BookingVo } from '../vo/BookingVo';
import { CreateBookingDto } from '../dto/CreateBookingDto';
export interface IBookingService{
  create(dto:CreateBookingDto):Promise<BookingVo>
}