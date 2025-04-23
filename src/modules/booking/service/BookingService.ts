import { ITouristService } from "src/modules/tourist/service/ITouristService";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { BookingVo } from "../vo/BookingVo";
import { IBookingService } from "./IBookingService";
import { IPaymentService } from "src/modules/payment/service/IPaymentService";
import mongoose from "mongoose";
import { IBookingRepository } from "../repository/IBookingRepository";
import { CreatePaymentDto } from "../../payment/dto/CreatePaymentDto";
import { IBooking } from "../model/IBooking";
// import { CreateTouristDto } from '../../tourist/dto/CreateTouristDto';

export class BookingService implements IBookingService {
  private readonly touristService: ITouristService;
  private readonly paymentService: IPaymentService;
  private readonly bookingRepository: IBookingRepository;

  constructor(
    touristService: ITouristService,
    paymentService: IPaymentService,
    bookingRespository: IBookingRepository
  ) {
    this.touristService = touristService;
    this.paymentService = paymentService;
    this.bookingRepository = bookingRespository;
  }
  private mapToVo(bookingDoc: IBooking): BookingVo {
    return new BookingVo(
      bookingDoc._id.toString(),
      bookingDoc.additionalTourists.map((tourist) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.mainTouristId.toString(),
      bookingDoc.notes,
      [],
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString()
    );
  }
  async create(bookingDto: CreateBookingDto): Promise<BookingVo> {

    try {
      return await this.bookingRepository.createWithTransaction(
        async (session) => {
          if (!session) {
            throw new Error("Session is required for transaction");
          }

          const mainTouristVo = await this.touristService.create(
            bookingDto.mainTourist,
            session
          );
          
          const additionalTouristVos = await Promise.all(
            (bookingDto.additionalTourists||[]).map(async (tourist) => {
              return await this.touristService.create(tourist, session);
            })
          );

          const bookingData = {
            dateRangeId: bookingDto.dateRangeId,
            mainTouristId: mainTouristVo.id,
            additionalTouristIds: additionalTouristVos.map(
              (tourist) => tourist.id
            ),
            notes: bookingDto.notes,
            sellerId: bookingDto.sellerId,
            status: bookingDto.status,
            totalPrice: bookingDto.totalPrice,
            tourPackageId: bookingDto.tourPackageId,
          };
          const booking = await this.bookingRepository.createDB(
            bookingData,
            session
          );
          // console.log('bookingDto.payments::: ', bookingDto.payments);
          const paymentDto = CreatePaymentDto.parse(bookingDto.payments[0]);
          // console.log('paymentDto::: ', paymentDto);
          const paymentVo = await this.paymentService.create(
            { ...paymentDto, bookingId: booking?.id },
            session
          );
          // console.log('paymentVo::: ', paymentVo);


          await this.touristService.addBookingToTourist(
            mainTouristVo.id,
            booking?.id,
            session
          );
          for (const tourist of additionalTouristVos) {
            await this.touristService.addBookingToTourist(
              tourist.id,
              booking?.id,
              session
            );
          }
          // console.log('booking::: ', booking);

          const bookingVo = this.mapToVo(booking);
          // console.log('bookingVo::: ', bookingVo);
          return {...bookingVo,paymentIds:[paymentVo.id]}
          // return this.mapToVo(booking);
        }
      );

      // console.log('addtionalTouristVos::: ', addtionalTouristVos);
      // const paymentVos = await Promise.all(
      //   bookingDto.payments.map(async (payment) => {
      //     // return await this.paymentService.create({...payment, bookingId: ""});
      //   })
      // );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear booing: ${error.message}`);
      } else {
        throw new Error("Error desconocido al crear booking");
      }
    }
  }
}
