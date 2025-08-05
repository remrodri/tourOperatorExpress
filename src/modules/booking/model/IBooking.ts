import { Document, Types } from "mongoose";

export interface IBooking extends Document<Types.ObjectId> {
  touristsIds: Types.ObjectId[];
  dateRangeId: Types.ObjectId;
  notes: string;
  paymentIds: Types.ObjectId[];
  sellerId: Types.ObjectId;
  status: string;
  totalPrice: number;
  tourPackageId: Types.ObjectId;
  paymentProofFolder: string;
  attendance:{
    touristId:Types.ObjectId,
    status:"present" | "absent"
  }[]
}
