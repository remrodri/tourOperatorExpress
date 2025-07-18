import { ClientSession } from "mongoose";
import { DateRangeDto } from "../dto/DateRangeDto";
import { IDateRange } from "../model/IDateRange";

export interface IDateRangeRepository {
  getAllDB(): Promise<IDateRange[]>;
  createDB(dto: DateRangeDto, session?: ClientSession): Promise<IDateRange | null>;
  updateDB(id: string, dto: Partial<DateRangeDto>, session?: ClientSession): Promise<IDateRange | null>;
  findByIdDB(id: string): Promise<IDateRange | null>;
  addTourPackageIdToDateRange(id: string, tourPackageId: string, session?: ClientSession): Promise<IDateRange | null>;
  // createDBWithSession(
  //   dto: DateRangeDto, 
  //   session: ClientSession
  // ): Promise<IDateRange | null>;
}
