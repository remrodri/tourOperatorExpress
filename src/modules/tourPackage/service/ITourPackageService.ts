import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageDto } from "../dto/TourPackageDto";
import { TourPackageVo } from "../vo/TourPackageVo";
import { TourPackageCreatedVo } from "../vo/tourPackageCreatedVo";
import { UpdateTourPackageDto } from "../dto/UpdateTourPackageDto";

export interface ITourPackageService {
  delete(dto: DeleteTourPackageDto): Promise<TourPackageVo>;
  // update(id: string, dto: TourPackageDto): Promise<TourPackageVo>;
  update(id: string, dto: UpdateTourPackageDto): Promise<TourPackageVo>;
  createTourPackage(dto: TourPackageDto): Promise<TourPackageVo>;
  getAllTourPackages(): Promise<TourPackageVo[]>;
  createAllData(dto: TourPackageDto): Promise<TourPackageCreatedVo>;
}
