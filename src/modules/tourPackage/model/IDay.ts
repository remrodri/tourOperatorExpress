import { Document, Types } from "mongoose";
import { IActivity } from "./IActivity";

export interface IDay extends Document<Types.ObjectId> {
  dayNumber: number;
  activities: IActivity[];
}
