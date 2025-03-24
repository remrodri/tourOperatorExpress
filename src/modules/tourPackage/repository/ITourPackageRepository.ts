import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageDto } from "../dto/TourPackageDto";
import { ITourPackage } from "../model/ITourPackage";

export interface ITourPackageRepository {
  softDeleteDB(dto: DeleteTourPackageDto): Promise<ITourPackage | null>;
  findByIdDB(id: string): Promise<ITourPackage | null>;
  updateDB(id: string, dto: any): Promise<ITourPackage | null>;
  // createDB(dto: TourPackageDto): Promise<ITourPackage | null>;
  createDB(dto: any): Promise<ITourPackage | null>;
  geatAllDB(): Promise<ITourPackage[]>;
}
