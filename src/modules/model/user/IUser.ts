import { Document, Types } from "mongoose";

export interface IUser extends Document<Types.ObjectId> {
  firstName: string;
  lastName: string;
  phone: string;
  ci: string;
  email: string;
  password: string;
  deleted: boolean;
  firstLogin: boolean;
  role: string;
}
