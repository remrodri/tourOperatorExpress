import { TourPackageDto } from "../dto/CreateTourPackageDto";
import { TourPackageVo } from "../vo/TourPackageVo";

export interface ITourPackageService {
  createTourPackage(dto: TourPackageDto): Promise<TourPackageVo>;
  getAllTourPackages(): Promise<TourPackageVo[]>;
}
