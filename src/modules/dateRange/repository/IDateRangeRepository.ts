import { DateRangeDto } from "../dto/DateRangeDto";
import { IDateRange } from "../model/IDateRange";

export interface IDateRangeRepository {
  getAllDB(): Promise<IDateRange[]>;
  createDB(dto: DateRangeDto): Promise<IDateRange | null>;
  updateDB(id: string, dto: DateRangeDto): Promise<IDateRange | null>;
  findByIdDB(id: string): Promise<IDateRange | null>;
}
