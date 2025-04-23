import { Document, Types } from "mongoose";

export interface IBooking extends Document<Types.ObjectId> {
  additionalTourists: Types.ObjectId[];
  dateRangeId: Types.ObjectId;
  mainTouristId: Types.ObjectId;
  notes: string;
  paymentIds: Types.ObjectId[];
  sellerId: Types.ObjectId;
  status: string;
  totalPrice: number;
  tourPackageId: Types.ObjectId;
}
