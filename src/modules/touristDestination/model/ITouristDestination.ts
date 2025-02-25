import { Document, Types } from "mongoose";

export interface ITouristDestination extends Document<Types.ObjectId> {
  name: string;
  description: string;
  // createdBy: Types.ObjectId;
  deleted: boolean;
  imageFolder: string;
  images: string[];
}
