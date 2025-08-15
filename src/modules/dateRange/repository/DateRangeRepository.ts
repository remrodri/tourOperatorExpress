import { ClientSession } from "mongoose";
import { DateRangeDto } from "../dto/DateRangeDto";
import { DateRangeModel } from "../model/DateRangeModel";
import { IDateRange } from "../model/IDateRange";
import { IDateRangeRepository } from "./IDateRangeRepository";
import { UpdateDateRangeDto } from "../dto/UpdateDateRangeDto";

export class DateRangeRepository implements IDateRangeRepository {
  async updateDateRangeDB(id: string, dto: UpdateDateRangeDto): Promise<IDateRange | null> {
    const updatedDateRange = 
    await DateRangeModel.findByIdAndUpdate(
      id, 
      dto, 
      { new: true }
    );
    if (!updatedDateRange) {
      throw new Error(`DateRange con ID ${id} no encontrado`);
    }
    return updatedDateRange;
  }
  
  async addTourPackageIdToDateRange(id: string, tourPackageId: string, session?: ClientSession): Promise<IDateRange | null> {
    const updatedDateRange = 
    await DateRangeModel.findByIdAndUpdate(
      id, 
      { tourPackageId: tourPackageId }, 
      { new: true, session:session }
    );
    if (!updatedDateRange) {
      throw new Error(`DateRange con ID ${id} no encontrado`);
    }
    return updatedDateRange;
  }
  // createDBWithSession(dto: DateRangeDto, session: ClientSession): Promise<IDateRange | null> {
  //   const newDateRange = new DateRangeModel(dto);
  //   return newDateRange.save({ session });
  // }
  async getAllDB(): Promise<IDateRange[]> {
    return await DateRangeModel.find().exec();
  }
  async createDB(dto: DateRangeDto, session?: ClientSession): Promise<IDateRange | null> {
    const newDateRange = new DateRangeModel(dto);
    const savedDateRange = session
    ? await newDateRange.save({ session })
    : await newDateRange.save();
    return savedDateRange;
  }
  async updateDB(id: string, dto: Partial<DateRangeDto>, session?: ClientSession): Promise<IDateRange | null> {
    const updatedDateRange = 
    await DateRangeModel.findByIdAndUpdate(id, dto, { new: true, session:session });
    if (!updatedDateRange) {
      throw new Error(`DateRange con ID ${id} no encontrado`);
    }
    return updatedDateRange;
  }
  async findByIdDB(id: string): Promise<IDateRange | null> {
    return await DateRangeModel.findById(id).exec();
  }
}
