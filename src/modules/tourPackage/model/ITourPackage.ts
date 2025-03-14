import { Document, Types } from "mongoose";
import { IItinerary } from "./IItinerary";

export interface ITourPackage extends Document<Types.ObjectId> {
  name: string;
  tourType: Types.ObjectId;
  cancellationPolicy: Types.ObjectId;
  touristDestination: Types.ObjectId;
  duration: number;
  selectedDates: string[];
  price: number;
  itinerary: IItinerary;
  status: string;
  deleted: boolean;
}
