import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageDto } from "../dto/TourPackageDto";
import { TourPackageVo } from "../vo/TourPackageVo";
import { TourPackageCreatedVo } from "../vo/tourPackageCreatedVo";

export interface ITourPackageService {
  delete(dto: DeleteTourPackageDto): Promise<TourPackageVo>;
  update(id: string, dto: TourPackageDto): Promise<TourPackageVo>;
  createTourPackage(dto: TourPackageDto): Promise<TourPackageVo>;
  getAllTourPackages(): Promise<TourPackageVo[]>;
  createAllData(dto: TourPackageDto): Promise<TourPackageCreatedVo>;
}
