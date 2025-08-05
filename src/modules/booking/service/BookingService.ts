import { ITouristService } from "src/modules/tourist/service/ITouristService";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { BookingVo } from "../vo/BookingVo";
import { IBookingService } from "./IBookingService";
import { IPaymentService } from "src/modules/payment/service/IPaymentService";
import { ClientSession, Types } from "mongoose";
import { IBookingRepository } from "../repository/IBookingRepository";
import { CreatePaymentDto } from "../../payment/dto/CreatePaymentDto";
import { IBooking } from "../model/IBooking";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { TouristVo } from "src/modules/tourist/vo/TouristVo";
import { PaymentVo } from "src/modules/payment/vo/PaymentVo";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { CreateTourTypeDto } from "src/modules/tourType/dto/createTourTypeDto";
import { CreateTouristDto } from "src/modules/tourist/dto/CreateTouristDto";
import { BookingVoV2 } from "../vo/BookingVoV2";
import { IPayment } from "src/modules/payment/model/IPayment";
import { UpdateBookingAttendanceListsDto } from "../dto/UpdateBookingAttendanceListsDto";
import { BookingUpdatedAttendanceVo } from "../vo/BookingUpdatedAttendanceVo";

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
  async updateBookingAttendanceLists(
    dto: UpdateBookingAttendanceListsDto
  ): Promise<BookingUpdatedAttendanceVo[]> {
    try {
      const updatedBookings = await this.bookingRepository.updateBookingAttendanceLists(
        async (session) => {
          const results: BookingUpdatedAttendanceVo[] = [];
  
          for (const attList of dto) {
            const bookingDoc = await this.bookingRepository.getByIdDB(attList.bookingId, session);
            if (!bookingDoc) {
              throw new Error(`Booking not found for ID: ${attList.bookingId}`);
            }
  
            // Actualizamos o insertamos asistencia
            for (const att of attList.attendance) {
              const existing = bookingDoc.attendance.find((a) =>
                a.touristId.toString() === att.touristId
              );
  
              if (existing) {
                existing.status = att.status;
              } else {
                bookingDoc.attendance.push({ touristId: new Types.ObjectId(att.touristId), status: att.status });
              }
            }
  
            await bookingDoc.save({ session });
  
            results.push(new BookingUpdatedAttendanceVo(attList.bookingId, attList.attendance));
          }
  
          return results;
        }
      );
  
      return updatedBookings;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar asistencia: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar asistencia");
      }
    }
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
  async updateAllData(dto: UpdateAllDataBookingDto,id:string): Promise<BookingUpdatedVo> {
    let touristIds:string[] = [];
    try {
      const booking = await this.bookingRepository.updateWithTransaction(
        async (session) => {
          // console.log('session::: ', session?.transaction);
          if (!session) {
            throw new Error("Session is required for transaction");
          }
          const bookingDoc = await this.bookingRepository.getByIdDB(
            id,
            session
          );
          let filteredUpdatedTouristVos: TouristVo[] = [];
          if (!bookingDoc) {
            throw new Error("Booking not found");
          }

          const touristVos = await Promise.all(
            dto.tourists.map(async (tourist) => {
              
            const touristData = {
              firstName:tourist.firstName,
              lastName:tourist.lastName,
              email:tourist.email,
              phone:tourist.phone,
              nationality:tourist.nationality,
              documentType:tourist.documentType,
              ci:tourist.ci,
              dateOfBirth:tourist.dateOfBirth,
              passportNumber:tourist.passportNumber,
            }
            if(tourist.id!==""){
              return await this.touristService.update(tourist.id, touristData, session)
            }
              const createdTourist = await this.touristService.create({...touristData,bookingIds:[id]}, session)
              // console.log('createdTourist::: ', createdTourist);
              touristIds.push(createdTourist.id)
              return createdTourist
          })
          );
          // console.log('touristVos::: ', touristVos);
          filteredUpdatedTouristVos = touristVos.filter(
            (tourist) => tourist !== null
          );
          // console.log('filteredUpdatedTouristVos::: ', filteredUpdatedTouristVos);

          const bookingData = {
            touristsIds: [...bookingDoc.touristsIds,...touristIds],
            notes: dto.notes,
            status: dto.status,
            totalPrice: dto.totalPrice,
          }
          // console.log('bookingData::: ', bookingData);
          const updatedBookingDoc = await this.bookingRepository.updateDB(
            id,
            bookingData,
            session
          );
          // console.log('updatedBookingDoc::: ', updatedBookingDoc);
          return this.mapToUpdatedVo(updatedBookingDoc,filteredUpdatedTouristVos);
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
    updatedTouristVos: TouristVo[]
  ): BookingUpdatedVo | PromiseLike<BookingUpdatedVo> {
    return new BookingUpdatedVo(
      updatedBookingDoc._id.toString(),
      updatedTouristVos.reverse(),
      updatedBookingDoc.notes,
      updatedBookingDoc.status,
      updatedBookingDoc.totalPrice,
    );
  }


  async update(
    id: string,
    bookingData: Partial<UpdateBookingDto>,
    session: ClientSession
  ): Promise<BookingVo> {
    // console.log('bookingDatadeUpdate::: ', bookingData);
    try {
      const bookingDoc = await this.bookingRepository.getByIdDB(id, session);
      if (!bookingDoc) {
        throw new Error("Booking not found");
      }
      // console.log('bookingDoc::: ', bookingDoc);
      const updatedBookingDoc = await this.bookingRepository.updateDB(
        id,
        bookingData,
        session
      );
      // console.log('updatedBookingDoc::: ', updatedBookingDoc);
      return this.mapToVo(updatedBookingDoc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar el booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar el booking");
      }
    }
  }

  async getAll(): Promise<BookingVoV2[]> {
    try {
      const bookingDocs = await this.bookingRepository.getAllDB();
      if (!bookingDocs || bookingDocs.length === 0) {
        return [];
      }
      const bookingVos = bookingDocs.map((booking) => this.mapToVoV2(booking));
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

  private mapToVoV2(bookingDoc:any):BookingVoV2{
    return new BookingVoV2(
      bookingDoc._id.toString(),
      bookingDoc.touristsIds.map((tourist:any) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment:any) => {
        return {
          id:payment._id.toString(),
          amount:payment.amount,
          paymentDate:payment.paymentDate,
          paymentMethod:payment.paymentMethod,
          bookingId:payment.bookingId,
          touristId:payment.touristId,
          paymentProofImage:payment.paymentProofImage,
          sellerId:payment.sellerId,
        }
      }),
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString(),
      bookingDoc.paymentProofFolder,
      bookingDoc.attendance.map((attendance:any) => {
        return {
          touristId: attendance.touristId.toString(),
          status: attendance.status,
        };
      }),
      bookingDoc.createdAt.toString()
    );
  }
  private mapToVo(bookingDoc: IBooking): BookingVo {
    return new BookingVo(
      bookingDoc._id.toString(),
      bookingDoc.touristsIds.map((tourist) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment) => {
        return payment._id.toString()
      }),
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

          const touristVos = await Promise.all(
            bookingDto.tourists.map(async (tourist) => {
              return await this.touristService.create(tourist, session);
            })
          );

          const bookingData = {
            paymentProofImage: bookingDto.paymentProofImage,
            dateRangeId: bookingDto.dateRangeId,
            touristsIds: touristVos.map((tourist) => tourist.id),
            notes: bookingDto.notes,
            sellerId: bookingDto.sellerId,
            status: bookingDto.status,
            totalPrice: bookingDto.totalPrice,
            tourPackageId: bookingDto.tourPackageId,
            paymentProofFolder: bookingDto.paymentProofFolder,
            attendance:touristVos.map((touristVo) => {
              return {
                touristId: touristVo.id,
                status: "absent",
              };
            }),
          };
          const booking = await this.bookingRepository.createDB(
            bookingData,
            session
          );
          const paymentDto = CreatePaymentDto.parse({
            ...bookingDto.firstPayment,
            touristId:touristVos[touristVos.length - 1].id,
            bookingId:booking.id,
            paymentProofImage: bookingDto.paymentProofImage,
          });
          const paymentVo = await this.paymentService.create(
            paymentDto,
            session
          );

          const bookingUpdated = await this.bookingRepository.updateDB(
            booking.id,
            {paymentIds:[paymentVo.id]},
            session
          );
          
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
      bookingDoc.paymentProofFolder,
      bookingDoc.attendance.map((attendance) => {
        return {
          touristId: attendance.touristId.toString(),
          status: attendance.status,
        };
      })
    );
  }
}
