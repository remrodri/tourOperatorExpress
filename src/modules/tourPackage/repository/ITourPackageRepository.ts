import { TourPackageDto } from "../dto/CreateTourPackageDto";
import { ITourPackage } from "../model/ITourPackage";

export interface ITourPackageRepository {
  createDB(dto: TourPackageDto): Promise<ITourPackage | null>;
  geatAllDB(): Promise<ITourPackage[]>;
}
