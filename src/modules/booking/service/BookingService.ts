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
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { TouristVo } from "src/modules/tourist/vo/TouristVo";
import { PaymentVo } from "src/modules/payment/vo/PaymentVo";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
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
  async getById(id: string, session?: ClientSession): Promise<BookingVo> {
try {
  const bookingDoc = await this.bookingRepository.getByIdDB(id, session);
  if (!bookingDoc) {
    throw new Error("Booking not found");
  }
  return this.mapToVo(bookingDoc);
} catch (error) {
  if (error instanceof Error) {
    throw new Error(`Error al obtener booking: ${error.message}`);
  } else {
    throw new Error("Error desconocido al obtener booking");
  }
}
  }
  async updateAllData(dto: UpdateAllDataBookingDto): Promise<BookingUpdatedVo> {
    try {
      const booking = await this.bookingRepository.updateWithTransaction(
        async (session) => {
          if (!session) {
            throw new Error("Session is required for transaction");
          }
          const bookingDoc = await this.bookingRepository.getByIdDB(
            dto.id,
            session
          );
          if (!bookingDoc) {
            throw new Error("Booking not found");
          }
          const mainTouristVo = await this.touristService.getById(
            dto.mainTourist.id
          );
          if (!mainTouristVo) {
            throw new Error("Main tourist not found");
          }
          const mainTouristUpdated = await this.touristService.update(
            dto.mainTourist.id,
            dto.mainTourist,
            session
          );
          if (!mainTouristUpdated) {
            throw new Error("Main tourist update returned null or undefined");
          }
          // console.log('dto.additionalTourists::: ', dto.additionalTourists);
          const additionalTouristUpdated = await Promise.all(
            dto.additionalTourists
            .map(async (tourist) => {
              return tourist.id
              ? await this.touristService.update(
                tourist.id,
                tourist,
                session
              )
              : await this.touristService.create(
                tourist,
                session
              )
            })
          );
          const additionalTouristUpdatedFiltered = additionalTouristUpdated.filter((tourist) => tourist !== null);
          if (!additionalTouristUpdatedFiltered) {
            throw new Error("Additional tourist update returned null or undefined");
          }
          console.log('additionalTouristUpdatedFiltered::: ', additionalTouristUpdatedFiltered);

          const additionalTouristsWithBookingIds = await Promise.all(
            additionalTouristUpdatedFiltered.map(async (tourist) => {
              return await this.touristService.addBookingToTourist(
                tourist.id,
                dto.id,
                session
              )
            })
          );

          const bookingData = {
            dateRangeId: dto.dateRangeId,
            mainTouristId: mainTouristUpdated.id,
            additionalTouristIds: additionalTouristUpdatedFiltered.map((tourist) => tourist?.id),
            notes: dto.notes,
            sellerId: dto.sellerId,
            status: dto.status,
            totalPrice: dto.totalPrice,
            tourPackageId: dto.tourPackageId,
          }
          const updatedBookingDoc = await this.bookingRepository.updateDB(
            dto.id,
            bookingData,
            session
          );
          return this.mapToUpdatedVo(updatedBookingDoc, mainTouristUpdated, additionalTouristsWithBookingIds);
        }
      );
      return booking;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar el booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar el booking");
      }
    }
  }
  mapToUpdatedVo(
    updatedBookingDoc: IBooking, 
    maintouristVo: TouristVo, 
    additionalTouristVos: TouristVo[]
  ): BookingUpdatedVo | PromiseLike<BookingUpdatedVo> {
    return new BookingUpdatedVo(
      updatedBookingDoc._id.toString(),
      additionalTouristVos,
      updatedBookingDoc.dateRangeId.toString(),
      maintouristVo,
      updatedBookingDoc.notes,
      updatedBookingDoc.sellerId._id.toString(),
      updatedBookingDoc.status,
      updatedBookingDoc.totalPrice,
      updatedBookingDoc.tourPackageId._id.toString(),
      // updatedBookingDoc.paymentIds.map((payment) => payment._id.toString()),

    );
  }


  async update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo> {
    console.log('bookingDatadeUpdate::: ', bookingData);
    try {
      const bookingDoc = await this.bookingRepository.getByIdDB(id, session);
      if (!bookingDoc) {
        throw new Error("Booking not found");
      }
      console.log('bookingDoc::: ', bookingDoc);
      const updatedBookingDoc = await this.bookingRepository.updateDB(
        id,
        bookingData,
        session
      );
      console.log('updatedBookingDoc::: ', updatedBookingDoc);
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
      // console.log("bookingVos::: ", bookingVos);
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
      bookingDoc.touristsIds.map((tourist) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment) => payment._id.toString()),
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString(),
      bookingDoc.paymentProofFolder
      
    );
  }

  async createAllData(bookingDto: CreateBookingDto): Promise<BookingCreatedVo> {
    try {
      return await this.bookingRepository.createWithTransaction2(
        async (session) => {
          if (!session) {
            throw new Error("Session is required for transaction");
          }

          // const mainTouristVo = await this.touristService.create(
          //   bookingDto.mainTourist,
          //   session
          // );

          const touristVos = await Promise.all(
            bookingDto.tourists.map(async (tourist) => {
              return await this.touristService.create(tourist, session);
            })
          );

          // const additionalTouristIds = additionalTouristVos.map((tourist) => {
          //   return tourist.id;
          // });
          // await this.bookingRepository.updateDB()

          const bookingData = {
            paymentProofImage: bookingDto.paymentProofImage,
            dateRangeId: bookingDto.dateRangeId,
            touristsIds: touristVos.map((tourist) => tourist.id),
            // mainTouristId: mainTouristVo.id,
            // additionalTouristIds: additionalTouristIds,
            // additionalTouristIds: additionalTouristVos.map(
            //   (tourist) => tourist.id
            // ),
            notes: bookingDto.notes,
            sellerId: bookingDto.sellerId,
            status: bookingDto.status,
            totalPrice: bookingDto.totalPrice,
            tourPackageId: bookingDto.tourPackageId,
            paymentProofFolder: bookingDto.paymentProofFolder,
          };
          const booking = await this.bookingRepository.createDB(
            bookingData,
            session
          );
          // console.log('bookingDto.payments::: ', bookingDto.payments);
          const paymentDto = CreatePaymentDto.parse({
            ...bookingDto.firstPayment,
            touristId:touristVos[touristVos.length - 1].id,
            bookingId:booking.id,
            paymentProofImage: bookingDto.paymentProofImage,
          });
          // console.log('paymentDto::: ', paymentDto);
          const paymentVo = await this.paymentService.create(
            paymentDto,
            session
          );

          const bookingUpdated = await this.bookingRepository.updateDB(
            booking.id,
            {paymentIds:[paymentVo.id]},
            // {
            //   $push: { paymentIds: paymentVo.id },
            // } as mongoose.UpdateQuery<IBooking>,
            session
          );
          // console.log('paymentVo::: ', paymentVo);
          // const updatedBooking = await this.bookingRepository.getByIdDB(
          //   booking.id,
          //   session
          // );
          
          const touristsUpdated = await Promise.all(
            touristVos.map(async (tourist) => {
              return await this.touristService.addBookingToTourist(
                tourist.id,
                booking.id,
                session
              )
            })
          );
          
          
          return this.mapToVoAllData(
            bookingUpdated,
            touristsUpdated,
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
    touristsUpdated: TouristVo[],
    paymentVo: PaymentVo
  ): BookingCreatedVo {
    return new BookingCreatedVo(
      bookingDoc._id.toString(),
      touristsUpdated,
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      [paymentVo],
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString(),
      bookingDoc.paymentProofFolder
    );
  }
}
