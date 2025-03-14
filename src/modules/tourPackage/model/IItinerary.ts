import { Document, Types } from "mongoose";
import { IDay } from "./IDay";

export interface IItinerary extends Document<Types.ObjectId>{
  days:IDay[]
}