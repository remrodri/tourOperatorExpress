import { Document, Types } from "mongoose";

export interface ITourist extends Document<Types.ObjectId> {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  documentType: string;
  ci: string;
  passportNumber: string;
  dateOfBirth: string;
  bookingIds: string[];
  // status: string;
  dataOrigin?: "legacy" | "simulated" | "manual";
  simulationId?: string;
  simulationVersion?: string;
  simulationSeed?: number;
  simulationKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
