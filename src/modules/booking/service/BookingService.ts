import { ITouristService } from "src/modules/tourist/service/ITouristService";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { BookingVo } from "../vo/BookingVo";
import { IBookingService } from "./IBookingService";
import { IPaymentService } from "src/modules/payment/service/IPaymentService";
import mongoose, { ClientSession } from "mongoose";
import { IBookingRepository } from "../repository/IBookingRepository";
import { CreatePaymentDto } from "../../payment/dto/CreatePaymentDto";
import { IBooking } from "../model/IBooking";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { TouristVo } from "src/modules/tourist/vo/TouristVo";
import { PaymentVo } from "src/modules/payment/vo/PaymentVo";
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
  // createAllData(dto: CreateBookingDto): Promise<BookingCreatedVo> {
  //   throw new Error("Method not implemented.");
  // }

  async update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo> {
    try {
      const bookingDoc = await this.bookingRepository.getByIdDB(id, session);
      if (!bookingDoc) {
        throw new Error("Booking not found");
      }
      const updatedBookingDoc = await this.bookingRepository.updateDB(
        id,
        bookingData,
        session
      );
      return this.mapToVo(updatedBookingDoc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar el booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar el booking");
      }
    }
  }

  async getAll(): Promise<BookingVo[]> {
    try {
      const bookingDocs = await this.bookingRepository.getAllDB();
      if (!bookingDocs || bookingDocs.length === 0) {
        return [];
      }
      const bookingVos = bookingDocs.map((booking) => this.mapToVo(booking));
      console.log("bookingVos::: ", bookingVos);
      return bookingVos;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener booings: ${error.message}`);
      } else {
        throw new Error("Error desconocido al obtener bookings");
      }
    }
  }
  private mapToVo(bookingDoc: IBooking): BookingVo {
    return new BookingVo(
      bookingDoc._id.toString(),
      // bookingDoc.additionalTouristIds.map((tourist) => tourist._id.toString()),
      bookingDoc.additionalTouristIds.map((tourist) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.mainTouristId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment) => payment._id.toString()),
      // [],
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
            bookingDto.additionalTourists.map(async (tourist) => {
              return await this.touristService.create(tourist, session);
            })
          );

          const additionalTouristIds = additionalTouristVos.map((tourist) => {
            return tourist.id;
          });
          // await this.bookingRepository.updateDB()

          const bookingData = {
            dateRangeId: bookingDto.dateRangeId,
            mainTouristId: mainTouristVo.id,
            additionalTouristIds: additionalTouristIds,
            // additionalTouristIds: additionalTouristVos.map(
            //   (tourist) => tourist.id
            // ),
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

          await this.bookingRepository.updateDB(
            booking.id,
            {
              $push: { paymentIds: paymentVo.id },
            } as mongoose.UpdateQuery<IBooking>,
            session
          );
          // console.log('paymentVo::: ', paymentVo);
          const updatedBooking = await this.bookingRepository.getByIdDB(
            booking.id,
            session
          );

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
          return this.mapToVo(updatedBooking);
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al crear booking");
      }
    }
  }

  async createAllData(bookingDto: CreateBookingDto): Promise<BookingCreatedVo> {
    try {
      return await this.bookingRepository.createWithTransaction2(
        async (session) => {
          if (!session) {
            throw new Error("Session is required for transaction");
          }

          const mainTouristVo = await this.touristService.create(
            bookingDto.mainTourist,
            session
          );

          const additionalTouristVos = await Promise.all(
            bookingDto.additionalTourists.map(async (tourist) => {
              return await this.touristService.create(tourist, session);
            })
          );

          const additionalTouristIds = additionalTouristVos.map((tourist) => {
            return tourist.id;
          });
          // await this.bookingRepository.updateDB()

          const bookingData = {
            dateRangeId: bookingDto.dateRangeId,
            mainTouristId: mainTouristVo.id,
            additionalTouristIds: additionalTouristIds,
            // additionalTouristIds: additionalTouristVos.map(
            //   (tourist) => tourist.id
            // ),
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

          await this.bookingRepository.updateDB(
            booking.id,
            {
              $push: { paymentIds: paymentVo.id },
            } as mongoose.UpdateQuery<IBooking>,
            session
          );
          // console.log('paymentVo::: ', paymentVo);
          const updatedBooking = await this.bookingRepository.getByIdDB(
            booking.id,
            session
          );

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
          return this.mapToVoAllData(
            updatedBooking,
            mainTouristVo,
            additionalTouristVos,
            paymentVo
          );
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al crear booking");
      }
    }
  }

  private mapToVoAllData(
    bookingDoc: IBooking,
    maintouristVo: TouristVo,
    additionalTouristVos: TouristVo[],
    paymentVo: PaymentVo
  ): BookingCreatedVo {
    return new BookingCreatedVo(
      bookingDoc._id.toString(),
      additionalTouristVos,
      bookingDoc.dateRangeId.toString(),
      maintouristVo,
      bookingDoc.notes,
      [paymentVo],
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString()
    );
  }
}
