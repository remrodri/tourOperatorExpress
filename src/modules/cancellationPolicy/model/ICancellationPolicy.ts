import { Document, Types } from "mongoose";

export interface ICancellationPolicy extends Document<Types.ObjectId> {
  name: string;
  deadLine: number;
  refoundPercentage: number;
  description: string;
}
