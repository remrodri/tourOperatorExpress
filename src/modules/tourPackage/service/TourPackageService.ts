import { TourPackageDto } from "../dto/TourPackageDto";
import { ITourPackageRepository } from "../repository/ITourPackageRepository";
import { TourPackageVo } from "../vo/TourPackageVo";
import { ITourPackageService } from "./ITourPackageService";
import { HttpException } from "../../../middleware/httpException";
import { StatusCodes } from "http-status-codes";
import { ITourPackage } from "../model/ITourPackage";
import { IDateRangeService } from "../../dateRange/service/IDateRangeService";
import { DateRangeDto } from "../../dateRange/dto/DateRangeDto";
import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageCreatedVo } from "../vo/tourPackageCreatedVo";
import { ClientSession } from "mongoose";
import { UpdateTourPackageDto } from "../dto/UpdateTourPackageDto";
import { TourPackageWithDRVo } from "../vo/TourPackageWithDRVo";

export class TourPackageService implements ITourPackageService {
  private readonly tourPackageRepository: ITourPackageRepository;
  private readonly dateRangeService: IDateRangeService;

  constructor(
    tourPackageRepository: ITourPackageRepository,
    dateRangeService: IDateRangeService
  ) {
    this.tourPackageRepository = tourPackageRepository;
    this.dateRangeService = dateRangeService;
  }
  async getAllTourPackagesWithDateRangesInfo(): Promise<TourPackageVo[]> {
    try {
      const tourPackages = await this.tourPackageRepository.getAllDB();
      // console.log("tourPackages::: ", tourPackages);

      if (!tourPackages || tourPackages.length === 0) {
        return [];
      }

      const tpsWithDateRangeInfo = await Promise.all(
        tourPackages.map(async (tourPackage) => {
          const dateRangeIds = tourPackage.dateRanges.map((dr) =>
            dr._id.toString()
          );
          const dateRangesInfo = await Promise.all(
            dateRangeIds.map(async (id) => {
              return this.dateRangeService.findById(id);
            })
          );
          return { ...tourPackage.toObject(), dateRanges: dateRangesInfo };
        })
      );
      // console.log("tpsWithDateRangeInfo::: ", tpsWithDateRangeInfo);
      // tpsWithDateRangeInfo.forEach((tp) => console.log("tp.dateRanges::: ", tp.dateRanges));

      const vos = tpsWithDateRangeInfo.map(
        (tourPackage) =>
          new TourPackageWithDRVo(
            tourPackage._id.toString(),
            tourPackage.name,
            tourPackage.tourType.toString(),
            tourPackage.cancellationPolicy.toString(),
            tourPackage.touristDestination.toString(),
            tourPackage.duration,
            tourPackage.dateRanges,
            tourPackage.price,
            {
              days: tourPackage.itinerary.days.map((day: any) => ({
                dayNumber: day.dayNumber,
                activities: day.activities.map((activity: any) => ({
                  description: activity.description,
                  time: activity.time,
                })),
              })),
            },
            tourPackage.status
          )
      );
      return vos;
    } catch (error) {
      console.error("Error getting all tour packages:", error);
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al obtener paquetes turísticos"
      );
    }
  }

  async addDateRangeToTourPackage(
    id: string,
    dateRangeId: string
  ): Promise<TourPackageVo> {
    const tpFound = await this.tourPackageRepository.findByIdDB(id);
    if (!tpFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Tour package not found");
    }
    const tpUpdated =
      await this.tourPackageRepository.addDateRangeToTourPackage(
        id,
        dateRangeId
      );
    if (!tpUpdated) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error adding date range to tour package"
      );
    }
    return new TourPackageVo(
      tpUpdated._id.toString(),
      tpUpdated.name,
      tpUpdated.tourType.toString(),
      tpUpdated.cancellationPolicy.toString(),
      tpUpdated.touristDestination.toString(),
      tpUpdated.duration,
      tpUpdated.dateRanges.map((dr) => {
        return { id: dr._id.toString() };
      }),
      tpUpdated.price,
      tpUpdated.itinerary,
      tpUpdated.status
    );
  }

  async delete(dto: DeleteTourPackageDto): Promise<TourPackageVo> {
    const tpFound = await this.tourPackageRepository.findByIdDB(dto.id);
    if (!tpFound) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Tour package not found");
    }
    const tpDeleted = await this.tourPackageRepository.softDeleteDB(dto);
    if (!tpDeleted) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error deleting tour package"
      );
    }
    return new TourPackageVo(
      tpDeleted._id.toString(),
      tpDeleted.name,
      tpDeleted.tourType.toString(),
      tpDeleted.cancellationPolicy.toString(),
      tpDeleted.touristDestination.toString(),
      tpDeleted.duration,
      tpDeleted.dateRanges.map((dr) => {
        return { id: dr._id.toString() };
      }),
      tpDeleted.price,
      tpDeleted.itinerary,
      tpDeleted.status
    );
  }
  async createAllData(dto: TourPackageDto): Promise<TourPackageCreatedVo> {
    try {
      return await this.tourPackageRepository.createWithTransaction(
        async (session: ClientSession) => {
          if (!session) {
            throw new Error("Session is required for transaction");
          }

          const dateRanges = await Promise.all(
            dto.dateRanges.map(async (dateRange) => {
              const dateRangeDto: DateRangeDto = {
                dates: dateRange.dates,
                state: "pending",
                guides: dateRange.guides,
              };
              // return await this.dateRangeService.create(dateRangeDto);
              return await this.dateRangeService.createWithSession(dateRangeDto, session);
            })
          );
          const tourPackageToCreate = {
            ...dto,
            dateRanges: dateRanges.map((dr) => dr.id),
          };
          const tourPackageDoc = await this.tourPackageRepository.createDB(
            tourPackageToCreate,
            session
          );
          if (!tourPackageDoc) {
            throw new HttpException(
              StatusCodes.INTERNAL_SERVER_ERROR,
              "Error creating tour package"
            );
          }
          const updatedDateRanges = await Promise.all(
            dateRanges.map(async (dateRange) => {
              return await this.dateRangeService.addTourPackageIdToDateRange(
                dateRange.id.toString(),
                tourPackageDoc._id.toString(),
                session
              );
            })
          );
          return new TourPackageCreatedVo(
            tourPackageDoc._id.toString(),
            tourPackageDoc.name,
            tourPackageDoc.tourType.toString(),
            tourPackageDoc.cancellationPolicy.toString(),
            tourPackageDoc.touristDestination.toString(),
            tourPackageDoc.duration,
            updatedDateRanges,
            tourPackageDoc.price,
            tourPackageDoc.itinerary,
            tourPackageDoc.status
          );
        }
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
  // async createTourPackage(dto: TourPackageDto): Promise<TourPackageVo> {
  //   try {
  //     // Process date ranges
  //     const dateRanges = await Promise.all(
  //       dto.dateRanges.map(async (range) => {
  //         const dateRangeDto: DateRangeDto = {
  //           dates: range.dates,
  //           state: "pending",
  //           guides: range.guides,
  //         };
  //         const dateRangeVo = await this.dateRangeService.create(dateRangeDto);
  //         // return { id: dateRangeVo.id };
  //         return dateRangeVo.id;
  //         // return dateRangeVo;
  //       })
  //     );

  //     // Create the tour package with date range references
  //     const tourPackageData = {
  //       ...dto,
  //       dateRanges: dateRanges,
  //     };

  //     const createdTourPackage = await this.tourPackageRepository.createDB(
  //       tourPackageData
  //     );

  //     if (!createdTourPackage) {
  //       throw new HttpException(
  //         StatusCodes.INTERNAL_SERVER_ERROR,
  //         "Error al crear paquete turístico"
  //       );
  //     }
  //     // const drs = createdTourPackage.dateRanges.map((dr) => dr._id.toString());

  //     return new TourPackageVo(
  //       createdTourPackage._id.toString(),
  //       createdTourPackage.name,
  //       createdTourPackage.tourType.toString(),
  //       createdTourPackage.cancellationPolicy.toString(),
  //       createdTourPackage.touristDestination.toString(),
  //       createdTourPackage.duration,
  //       // createdTourPackage.dateRanges,
  //       // createdTourPackage.dateRanges.map((dr) => dr._id.toString()),
  //       createdTourPackage.dateRanges.map((dr) => {
  //         return { id: dr._id.toString() };
  //       }),
  //       createdTourPackage.price,
  //       {
  //         days: createdTourPackage.itinerary.days.map((day) => ({
  //           dayNumber: day.dayNumber,
  //           activities: day.activities.map((activity) => ({
  //             description: activity.description,
  //             time: activity.time,
  //           })),
  //         })),
  //       },
  //       createdTourPackage.status
  //     );
  //   } catch (error) {
  //     console.error("Error creating tour package:", error);
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       StatusCodes.INTERNAL_SERVER_ERROR,
  //       "Error al crear paquete turístico"
  //     );
  //   }
  // }

  async update(id: string, dto: UpdateTourPackageDto): Promise<TourPackageVo> {
    try {
      const existingTourPackage = await this.tourPackageRepository.findByIdDB(
        id
      );

      if (!existingTourPackage) {
        throw new HttpException(
          StatusCodes.NOT_FOUND,
          "Paquete turístico no encontrado"
        );
      }

      // // Process date ranges
      // const dateRangeIds = await Promise.all(
      //   dto.dateRanges.map(async (range) => {
      //     const dateRangeDto: DateRangeDto = {
      //       dates: range.dates,
      //       state: "activo",
      //     };
      //     const dateRangeVo = await this.dateRangeService.create(dateRangeDto);
      //     return dateRangeVo.id;
      //   })
      // );

      // Update tour package with new date range references
      const updatedTourPackage = await this.tourPackageRepository.updateDB(id, {
        ...dto,
        // dateRanges: dateRangeIds,
      });

      if (!updatedTourPackage) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error al actualizar paquete turístico"
        );
      }

      return new TourPackageVo(
        updatedTourPackage._id.toString(),
        updatedTourPackage.name,
        updatedTourPackage.tourType.toString(),
        updatedTourPackage.cancellationPolicy.toString(),
        updatedTourPackage.touristDestination.toString(),
        updatedTourPackage.duration,
        // updatedTourPackage.dateRanges,
        updatedTourPackage.dateRanges.map((dr) => {
          return { id: dr._id.toString() };
        }),
        updatedTourPackage.price,
        {
          days: updatedTourPackage.itinerary.days.map((day) => ({
            dayNumber: day.dayNumber,
            activities: day.activities.map((activity) => ({
              description: activity.description,
              time: activity.time,
            })),
          })),
        },
        updatedTourPackage.status
      );
    } catch (error) {
      console.error("Error updating tour package:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al actualizar paquete turístico"
      );
    }
  }

  async getAllTourPackages(): Promise<TourPackageVo[]> {
    try {
      const tourPackages = await this.tourPackageRepository.getAllDB();
      // console.log("tourPackages::: ", tourPackages);

      if (!tourPackages || tourPackages.length === 0) {
        return [];
      }

      return tourPackages.map(
        (tourPackage) =>
          new TourPackageVo(
            tourPackage._id.toString(),
            tourPackage.name,
            tourPackage.tourType.toString(),
            tourPackage.cancellationPolicy.toString(),
            tourPackage.touristDestination.toString(),
            tourPackage.duration,
            tourPackage.dateRanges.map((dr) => {
              return { id: dr._id.toString() };
            }),

            tourPackage.price,
            {
              days: tourPackage.itinerary.days.map((day) => ({
                dayNumber: day.dayNumber,
                activities: day.activities.map((activity) => ({
                  description: activity.description,
                  time: activity.time,
                })),
              })),
            },
            tourPackage.status
          )
      );
    } catch (error) {
      console.error("Error getting all tour packages:", error);
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al obtener paquetes turísticos"
      );
    }
  }

  async findById(id: string): Promise<TourPackageVo> {
    try {
      const tourPackage = await this.tourPackageRepository.findByIdDB(id);

      if (!tourPackage) {
        throw new HttpException(
          StatusCodes.NOT_FOUND,
          "Paquete turístico no encontrado"
        );
      }

      return new TourPackageVo(
        tourPackage._id.toString(),
        tourPackage.name,
        tourPackage.tourType.toString(),
        tourPackage.cancellationPolicy.toString(),
        tourPackage.touristDestination.toString(),
        tourPackage.duration,
        tourPackage.dateRanges.map((dr) => {
          return { id: dr._id.toString() };
        }),
        tourPackage.price,
        {
          days: tourPackage.itinerary.days.map((day) => ({
            dayNumber: day.dayNumber,
            activities: day.activities.map((activity) => ({
              description: activity.description,
              time: activity.time,
            })),
          })),
        },
        tourPackage.status
      );
    } catch (error) {
      console.error("Error finding tour package by ID:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al buscar paquete turístico"
      );
    }
  }
}
