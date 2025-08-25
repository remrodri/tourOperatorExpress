import { ClientSession, startSession } from "mongoose";
import { ITourPackage } from "../model/ITourPackage";
import { TourPackageModel } from "../model/TourPackageModel";
import { ITourPackageRepository } from "./ITourPackageRepository";
import { DeleteTourPackageDto } from "../dto/DeleteTourPackageDto";
import { TourPackageCreatedVo } from "../vo/tourPackageCreatedVo";

export class TourPackageRepository implements ITourPackageRepository {
  async addDateRangeToTourPackage(id: string, dateRangeId: string): Promise<ITourPackage | null> {
    return await TourPackageModel.findByIdAndUpdate(
      id,
      { $push: { dateRanges: dateRangeId } },
      { new: true }
    );
  }
  async createWithTransaction(
    createTourPackageFn: (
      session: ClientSession
    ) => Promise<TourPackageCreatedVo>): 
    Promise<TourPackageCreatedVo> {
    const session = await startSession();
    try {
      session.startTransaction({
        writeConcern: { w: "majority" },
      });
      const tpCreated = await createTourPackageFn(session);
      await session.commitTransaction();
      return tpCreated;
    } catch (error) {
      console.error("Error durante la transacción:", error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async softDeleteDB(dto: DeleteTourPackageDto): Promise<ITourPackage | null> {
    return await TourPackageModel.findByIdAndUpdate(
      dto.id,
      { status: "inactive" },
      { new: true }
    );
  }
  async findByIdDB(id: string): Promise<ITourPackage | null> {
    return await TourPackageModel.findById(id);
  }
  async updateDB(id: string, dto: any): Promise<ITourPackage | null> {
    return await TourPackageModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async getAllDB(): Promise<ITourPackage[]> {
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
