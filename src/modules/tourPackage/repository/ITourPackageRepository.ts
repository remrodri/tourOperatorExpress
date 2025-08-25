import { ClientSession } from "mongoose";
import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageDto } from "../dto/TourPackageDto";
import { ITourPackage } from "../model/ITourPackage";
import { TourPackageCreatedVo } from "../vo/tourPackageCreatedVo";

export interface ITourPackageRepository {
  softDeleteDB(dto: DeleteTourPackageDto): Promise<ITourPackage | null>;
  findByIdDB(id: string): Promise<ITourPackage | null>;
  updateDB(id: string, dto: any): Promise<ITourPackage | null>;
  // createDB(dto: TourPackageDto): Promise<ITourPackage | null>;
  createDB(dto: any,session?:ClientSession): Promise<ITourPackage | null>;
  getAllDB(): Promise<ITourPackage[]>;
  createWithTransaction(
    createBookingFn: (session: ClientSession) => Promise<TourPackageCreatedVo>
  ): Promise<TourPackageCreatedVo>;
  addDateRangeToTourPackage(id: string, dateRangeId: string): Promise<ITourPackage | null>;
}
