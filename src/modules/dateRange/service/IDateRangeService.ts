import { ClientSession } from "mongoose";
import { DateRangeDto } from "../dto/DateRangeDto";
import { DateRangeVo } from "../vo/DateRangeVo";
import { UpdateDateRangeDto } from "../dto/UpdateDateRangeDto";

export interface IDateRangeService {
  create(dto: DateRangeDto): Promise<DateRangeVo>;
  update(id: string, dto: Partial<DateRangeDto>, session?: ClientSession): Promise<DateRangeVo>;
  findById(id: string): Promise<DateRangeVo>;
  getAll(): Promise<DateRangeVo[]>;
  createWithSession(
    dto: DateRangeDto, 
    session: ClientSession
  ): Promise<DateRangeVo>;
  addTourPackageIdToDateRange(id: string, tourPackageId: string, session?: ClientSession): Promise<DateRangeVo>;
  updateDateRange(id: string, dto: UpdateDateRangeDto): Promise<DateRangeVo>;
}
