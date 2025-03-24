import { DateRangeDto } from "../dto/DateRangeDto";
import { DateRangeVo } from "../vo/DateRangeVo";

export interface IDateRangeService {
  create(dto: DateRangeDto): Promise<DateRangeVo>;
  update(id: string, dto: DateRangeDto): Promise<DateRangeVo>;
  findById(id: string): Promise<DateRangeVo>;
  getAll(): Promise<DateRangeVo[]>;
}
