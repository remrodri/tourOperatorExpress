import { Types } from "mongoose";
import { TourPackageDto } from "../dto/CreateTourPackageDto";
import { ITourPackage } from "../model/ITourPackage";
import { TourPackageModel } from "../model/TourPackageModel";
import { ITourPackageRepository } from "./ITourPackageRepository";

export class TourPackageRepository implements ITourPackageRepository {
  async geatAllDB(): Promise<ITourPackage[]> {
    return await TourPackageModel.find().exec();
  }
  async createDB(dto: TourPackageDto): Promise<ITourPackage | null> {
    const tourPackage = new TourPackageModel(dto);
    return await tourPackage.save();
  }
}
