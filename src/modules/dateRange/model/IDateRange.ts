import { Document, Types } from "mongoose";
import type { DateRangeDataOrigin } from "../domain/dateRangeNormalization";

export interface IDateRange extends Document<Types.ObjectId> {
  dates: string[];
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  dataOrigin: DateRangeDataOrigin;
  simulationId?: string;
  simulationVersion?: string;
  simulationSeed?: number;
  simulationKey?: string;
  state: string;
  guides: string[];
  tourPackageId: string;
  createdAt: Date;
  updatedAt: Date;
}
