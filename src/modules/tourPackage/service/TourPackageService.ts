import { ITourTypeRepository } from "src/modules/tourType/repository/ITourTypeRepository";
import { TourPackageDto } from "../dto/CreateTourPackageDto";
import { ITourPackageRepository } from "../repository/ITourPackageRepository";
import { TourPackageVo } from "../vo/TourPackageVo";
import { ITourPackageService } from "./ITourPackageService";
import { HttpException } from "../../../middleware/httpException";
import { StatusCodes } from "http-status-codes";
import { ITourPackage } from "../model/ITourPackage";

export class TourPackgeService implements ITourPackageService {
  private readonly tourPackageRepository: ITourPackageRepository;

  constructor(tourPackageRepository: ITourPackageRepository) {
    this.tourPackageRepository = tourPackageRepository;
  }
  async getAllTourPackages(): Promise<TourPackageVo[]> {
    const tourPackages = await this.tourPackageRepository.geatAllDB();
    // console.log('tourPackages::: ', tourPackages);
    if (!tourPackages) {
      throw new HttpException(StatusCodes.NOT_FOUND, "Tour packages not found");
    }
    const vos = tourPackages.map(
      (tourPackage) =>
        new TourPackageVo(
          tourPackage._id.toString(),
          tourPackage.name,
          tourPackage.tourType.toString(),
          tourPackage.cancellationPolicy.toString(),
          tourPackage.touristDestination.toString(),
          tourPackage.duration,
          tourPackage.selectedDates,
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
    // console.log('vos::: ', vos);
    return vos;
  }

  async createTourPackage(dto: TourPackageDto): Promise<TourPackageVo> {
    // console.log('dto::: ', dto);
    const response = await this.tourPackageRepository.createDB(dto);
    // console.log('response::: ', response);
    if (!response) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error al crear paquete turistico"
      );
    }
    const vo = new TourPackageVo(
      response._id.toString(),
      response.name,
      response.tourType.toString(),
      response.cancellationPolicy.toString(),
      response.touristDestination.toString(),
      response.duration,
      response.selectedDates,
      response.price,
      {
        days: response.itinerary.days.map((day) => ({
          dayNumber: day.dayNumber,
          activities: day.activities.map((activity) => ({
            description: activity.description,
            time: activity.time,
          })),
        })),
      },
      response.status
    );
    return vo;
  }
}
