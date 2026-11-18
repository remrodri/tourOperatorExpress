import { ITouristService } from "../../tourist/service/ITouristService";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { BookingVo } from "../vo/BookingVo";
import { IBookingService } from "./IBookingService";
import { IPaymentService } from "../../payment/service/IPaymentService";
import { ClientSession, Types } from "mongoose";
import { IBookingRepository } from "../repository/IBookingRepository";
import { CreatePaymentDto } from "../../payment/dto/CreatePaymentDto";
import { IBooking } from "../model/IBooking";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import { BookingCreatedVo } from "../vo/BookignCreatedVo";
import { TouristVo } from "../../tourist/vo/TouristVo";
import { PaymentVo } from "../../payment/vo/PaymentVo";
import { BookingUpdatedVo } from "../vo/BookingUpdatedVo";
import { CreateTourTypeDto } from "../../tourType/dto/createTourTypeDto";
import { CreateTouristDto } from "../../tourist/dto/CreateTouristDto";
import { BookingVoV2 } from "../vo/BookingVoV2";
import { IPayment } from "../../payment/model/IPayment";
import { UpdateBookingAttendanceListsDto } from "../dto/UpdateBookingAttendanceListsDto";
import { BookingUpdatedAttendanceVo } from "../vo/BookingUpdatedAttendanceVo";
import { CancelBookingDto } from "../dto/CancelBookingDto";
import { randomBytes } from "crypto";
import { HttpException } from "../../../middleware/httpException";
import {
  BookingDateRangeSummaryQueryDto,
  BookingFeedQueryDto,
} from "../dto/BookingFeedQueryDto";
import {
  decodeCursor,
  encodeCursor,
} from "../../../utils/pagination/cursorPagination";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const generateBookingCode = (): string =>
  `RSV-${randomBytes(9).toString("base64url")}`;

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
  async cancelBooking(id: string, dto: CancelBookingDto): Promise<any> {
    try {
      const bookingDoc = await this.bookingRepository.getByIdDB(id);
      if (!bookingDoc) {
        throw new Error("Booking not found");
      }
      const updatedBookingDoc = await this.bookingRepository.updateDB(id, dto);
      return {
        id: updatedBookingDoc._id.toString(),
        cancellationFee: updatedBookingDoc.cancellationFee,
        refundAmount: updatedBookingDoc.refundAmount,
        refundedAt: updatedBookingDoc.refundedAt,
        status: updatedBookingDoc.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al cancelar el booking: ${error.message}`);
      } else {
        throw new Error("Error desconocido al cancelar el booking");
      }
    }
  }
  async updateBookingAttendanceLists(
    dto: UpdateBookingAttendanceListsDto
  ): Promise<BookingUpdatedAttendanceVo[]> {
    try {
      const updatedBookings =
        await this.bookingRepository.updateBookingAttendanceLists(
          async (session) => {
            const results: BookingUpdatedAttendanceVo[] = [];

            for (const attList of dto) {
              const bookingDoc = await this.bookingRepository.getByIdDB(
                attList.bookingId,
                session
              );
              if (!bookingDoc) {
                throw new Error(
                  `Booking not found for ID: ${attList.bookingId}`
                );
              }

              // Actualizamos o insertamos asistencia
              for (const att of attList.attendance) {
                const existing = bookingDoc.attendance.find(
                  (a) => a.touristId.toString() === att.touristId
                );

                if (existing) {
                  existing.status = att.status;
                } else {
                  bookingDoc.attendance.push({
                    touristId: new Types.ObjectId(att.touristId),
                    status: att.status,
                  });
                }
              }

              await bookingDoc.save({ session });

              results.push(
                new BookingUpdatedAttendanceVo(
                  attList.bookingId,
                  attList.attendance
                )
              );
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
  async updateAllData(
    dto: UpdateAllDataBookingDto,
    id: string
  ): Promise<BookingUpdatedVo> {
    let touristIds: string[] = [];
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
                firstName: tourist.firstName,
                lastName: tourist.lastName,
                email: tourist.email,
                phone: tourist.phone,
                nationality: tourist.nationality,
                documentType: tourist.documentType,
                ci: tourist.ci,
                dateOfBirth: tourist.dateOfBirth,
                passportNumber: tourist.passportNumber,
              };
              if (tourist.id !== "") {
                return await this.touristService.update(
                  tourist.id,
                  touristData,
                  session
                );
              }
              const createdTourist = await this.touristService.create(
                { ...touristData, bookingIds: [id] },
                session
              );
              // console.log('createdTourist::: ', createdTourist);
              touristIds.push(createdTourist.id);
              return createdTourist;
            })
          );
          // console.log('touristVos::: ', touristVos);
          filteredUpdatedTouristVos = touristVos.filter(
            (tourist) => tourist !== null
          );
          // console.log('filteredUpdatedTouristVos::: ', filteredUpdatedTouristVos);

          const bookingData = {
            touristsIds: [...bookingDoc.touristsIds, ...touristIds],
            notes: dto.notes,
            status: dto.status,
            totalPrice: dto.totalPrice,
          };
          // console.log('bookingData::: ', bookingData);
          const updatedBookingDoc = await this.bookingRepository.updateDB(
            id,
            bookingData,
            session
          );
          // console.log('updatedBookingDoc::: ', updatedBookingDoc);
          return this.mapToUpdatedVo(
            updatedBookingDoc,
            filteredUpdatedTouristVos
          );
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
      updatedBookingDoc.totalPrice
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

  async getFeed(dto: BookingFeedQueryDto): Promise<{
    items: BookingVoV2[];
    pagination: { nextCursor: string | null; hasMore: boolean };
  }> {
    try {
      const filter: Record<string, unknown> = {};
      if (dto.status) filter.status = dto.status;
      if (dto.tourPackageId) filter.tourPackageId = dto.tourPackageId;
      if (dto.dateRangeId) filter.dateRangeId = dto.dateRangeId;
      if (dto.bookingCode) {
        filter.bookingCode = {
          $regex: `^${escapeRegex(dto.bookingCode)}$`,
          $options: "i",
        };
      }

      const cursor = decodeCursor(dto.cursor);
      const bookingDocs = await this.bookingRepository.getFeedDB(
        filter,
        cursor,
        dto.limit
      );
      const hasMore = bookingDocs.length > dto.limit;
      const visible = hasMore ? bookingDocs.slice(0, dto.limit) : bookingDocs;
      const last = visible.at(-1);

      return {
        items: visible.map((booking) => this.mapToVoV2(booking)),
        pagination: {
          nextCursor:
            hasMore && last
              ? encodeCursor(last.createdAt as Date, last._id)
              : null,
          hasMore,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new Error(`Error al obtener reservas: ${error.message}`);
      }
      throw new Error("Error desconocido al obtener reservas");
    }
  }

  async getDetail(id: string): Promise<{
    booking: BookingVoV2;
    tourists: TouristVo[];
  }> {
    const bookingDoc = await this.bookingRepository.getByIdDetailDB(id);
    if (!bookingDoc) {
      throw new Error(`Booking with id ${id} not found`);
    }

    const tourists = ((bookingDoc.touristsIds ?? []) as any[])
      .filter((tourist) => tourist && tourist._id)
      .map(
        (tourist) =>
          new TouristVo(
            tourist._id.toString(),
            tourist.firstName,
            tourist.lastName,
            tourist.phone,
            tourist.email,
            tourist.nationality,
            tourist.documentType,
            tourist.ci,
            tourist.passportNumber,
            tourist.dateOfBirth,
            tourist.bookingIds ?? []
          )
      );

    return { booking: this.mapToVoV2(bookingDoc), tourists };
  }

  async getReportSummary(): Promise<{
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
  }> {
    const summary = await this.bookingRepository.getReportSummaryDB();
    const total = summary.total[0] ?? {
      totalBookings: 0,
      totalRevenue: 0,
    };

    return {
      totalBookings: total.totalBookings,
      totalRevenue: total.totalRevenue,
      years: summary.years.map((item) => item._id),
      byTourPackageMonth: summary.byTourPackageMonth.map((item) => ({
        tourPackageId: item.tourPackageId.toString(),
        year: item.year,
        month: item.month,
        count: item.count,
        totalAmount: item.totalAmount,
      })),
      bySellerTourPackage: summary.bySellerTourPackage.map((item) => ({
        sellerId: item.sellerId.toString(),
        tourPackageId: item.tourPackageId.toString(),
        count: item.count,
      })),
      daily: summary.daily,
    };
  }

  async getDateRangeSummary(
    dto: BookingDateRangeSummaryQueryDto
  ): Promise<{ bookingCount: number; touristCount: number }> {
    return this.bookingRepository.getDateRangeSummaryDB(
      dto.dateRangeId,
      dto.tourPackageId
    );
  }

  private mapToVoV2(bookingDoc: any): BookingVoV2 {
    return new BookingVoV2(
      bookingDoc._id.toString(),
      bookingDoc.touristsIds.map((tourist: any) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment: any) => {
        return {
          id: payment._id.toString(),
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          bookingId: payment.bookingId,
          touristId: payment.touristId,
          paymentProofImage: payment.paymentProofImage,
          sellerId: payment.sellerId,
        };
      }),
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString(),
      bookingDoc.paymentProofFolder,
      bookingDoc.attendance.map((attendance: any) => {
        return {
          touristId: attendance.touristId.toString(),
          status: attendance.status,
        };
      }),
      bookingDoc.createdAt.toString(),
      bookingDoc.cancellationFee,
      bookingDoc.refundAmount,
      bookingDoc.refundedAt,
      bookingDoc.bookingCode
    );
  }
  private mapToVo(bookingDoc: IBooking): BookingVo {
    return new BookingVo(
      bookingDoc._id.toString(),
      bookingDoc.touristsIds.map((tourist) => tourist._id.toString()),
      bookingDoc.dateRangeId.toString(),
      bookingDoc.notes,
      bookingDoc.paymentIds.map((payment) => {
        return payment._id.toString();
      }),
      bookingDoc.sellerId._id.toString(),
      bookingDoc.status,
      bookingDoc.totalPrice,
      bookingDoc.tourPackageId._id.toString(),
      bookingDoc.paymentProofFolder,
      bookingDoc.attendance.map((attendance: any) => {
        return {
          touristId: attendance.touristId.toString(),
          status: attendance.status,
        };
      }),
      bookingDoc.cancellationFee,
      bookingDoc.refundAmount,
      bookingDoc.refundedAt,
      bookingDoc.bookingCode
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
            bookingDto.tourists
              .map(async (tourist) => {
                if (tourist.id) {
                  return await this.touristService.getById(tourist.id);
                }
                return await this.touristService.create(tourist, session);
              })
              .filter((tourist) => tourist !== null)
          );

          const bookingData = {
            paymentProofImage: bookingDto.paymentProofImage,
            dateRangeId: bookingDto.dateRangeId,
            touristsIds: touristVos.map((tourist) => tourist?.id),
            notes: bookingDto.notes,
            sellerId: bookingDto.sellerId,
            status: bookingDto.status,
            totalPrice: bookingDto.totalPrice,
            tourPackageId: bookingDto.tourPackageId,
            paymentProofFolder: bookingDto.paymentProofFolder,
            attendance: touristVos
              .map((touristVo) => {
                return {
                  touristId: touristVo?.id,
                  status: "absent",
                };
              })
              .filter((attendance) => attendance !== null),
          };
          const bookingCode = generateBookingCode();
          const booking = await this.bookingRepository.createDB(
            bookingData,
            session,
            bookingCode
          );
          const paymentDto = CreatePaymentDto.parse({
            ...bookingDto.firstPayment,
            touristId: touristVos.at(-1)?.id,
            bookingId: booking.id,
            paymentProofImage: bookingDto.paymentProofImage,
          });
          const paymentVo = await this.paymentService.create(
            paymentDto,
            session
          );

          const bookingUpdated = await this.bookingRepository.updateDB(
            booking.id,
            { paymentIds: [paymentVo.id] },
            session
          );

          const touristsUpdated = await Promise.all(
            touristVos.map(async (tourist) => {
              return await this.touristService.addBookingToTourist(
                tourist!.id,
                booking.id,
                session
              );
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
      }),
      // bookingDoc.createdAt.toString(),
      bookingDoc.cancellationFee,
      bookingDoc.refundAmount,
      bookingDoc.refundedAt,
      bookingDoc.bookingCode
    );
  }
}
