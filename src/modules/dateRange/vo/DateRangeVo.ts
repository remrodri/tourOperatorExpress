import type { DateRangeDataOrigin } from "../domain/dateRangeNormalization";
import { tryResolveDateRangeBounds } from "../domain/dateRangeNormalization";
import type { IDateRange } from "../model/IDateRange";
import {
  evaluateEconomicPlan,
  type EconomicEvaluation,
  type EconomicPlan,
} from "../domain/economicPlanning";

export class DateRangeVo {
  constructor(
    public readonly id: string,
    public readonly dates: string[],
    public readonly state: string,
    public readonly guides: string[],
    public readonly tourPackageId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly capacity?: number,
    public readonly dataOrigin?: DateRangeDataOrigin,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly economicPlan?: EconomicPlan,
    public readonly economicEvaluation?: EconomicEvaluation
  ) {}

  static fromDocument(dateRange: IDateRange): DateRangeVo {
    const dates = dateRange.dates ?? [];
    const bounds =
      dateRange.startDate && dateRange.endDate
        ? null
        : tryResolveDateRangeBounds({ dates });

    return new DateRangeVo(
      dateRange._id.toString(),
      dates,
      dateRange.state,
      (dateRange.guides ?? []).map(String),
      dateRange.tourPackageId ? String(dateRange.tourPackageId) : "",
      dateRange.startDate ?? bounds?.startDate,
      dateRange.endDate ?? bounds?.endDate,
      typeof dateRange.capacity === "number" ? dateRange.capacity : undefined,
      dateRange.dataOrigin ?? "legacy",
      dateRange.createdAt,
      dateRange.updatedAt,
      dateRange.economicPlan,
      evaluateEconomicPlan(dateRange.economicPlan, dateRange.capacity)
    );
  }
}
