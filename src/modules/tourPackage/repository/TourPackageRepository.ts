import { Types } from "mongoose";
import { TourPackageDto } from "../dto/TourPackageDto";
import { ITourPackage } from "../model/ITourPackage";
import { TourPackageModel } from "../model/TourPackageModel";
import { ITourPackageRepository } from "./ITourPackageRepository";
import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";

export class TourPackageRepository implements ITourPackageRepository {
  async softDeleteDB(dto: DeleteTourPackageDto): Promise<ITourPackage | null> {
    return await TourPackageModel.findByIdAndUpdate(
      dto.id,
      { status: "draft" },
      { new: true }
    );
  }
  async findByIdDB(id: string): Promise<ITourPackage | null> {
    return await TourPackageModel.findById(id);
  }
  async updateDB(id: string, dto: any): Promise<ITourPackage | null> {
    return await TourPackageModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async geatAllDB(): Promise<ITourPackage[]> {
    return await TourPackageModel.find().exec();
  }
  async createDB(dto: any): Promise<ITourPackage | null> {
    const tourPackage = new TourPackageModel(dto);
    // await tourPackage.save();
    // return await tourPackage.populate({
    //   path: "dateRanges",
    //   select: "_id dates state",
    // });
    return await tourPackage.save();
  }
}
