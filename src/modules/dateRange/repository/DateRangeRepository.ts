import { DateRangeDto } from "../dto/DateRangeDto";
import { DateRangeModel } from "../model/DateRangeModel";
import { IDateRange } from "../model/IDateRange";
import { IDateRangeRepository } from "./IDateRangeRepository";

export class DateRangeRepository implements IDateRangeRepository {
  async getAllDB(): Promise<IDateRange[]> {
    return await DateRangeModel.find().exec();
  }
  async createDB(dto: DateRangeDto): Promise<IDateRange | null> {
    const newDateRange = new DateRangeModel(dto);
    return await newDateRange.save();
  }
  async updateDB(id: string, dto: DateRangeDto): Promise<IDateRange | null> {
    return await DateRangeModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async findByIdDB(id: string): Promise<IDateRange | null> {
    return await DateRangeModel.findById(id).exec();
  }
}
