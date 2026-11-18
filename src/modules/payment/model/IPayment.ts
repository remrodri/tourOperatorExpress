import { Document, Types } from "mongoose";

export interface IPayment extends Document<Types.ObjectId> {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  bookingId: string;
  paymentProofImage: string;
  sellerId: string;
  touristId: string;
  dataOrigin?: "legacy" | "simulated" | "manual";
  simulationId?: string;
  simulationVersion?: string;
  simulationSeed?: number;
  simulationKey?: string;
}
