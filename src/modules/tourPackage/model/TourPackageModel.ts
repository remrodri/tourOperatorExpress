import mongoose, { Schema } from "mongoose";
import { ITourPackage } from "./ITourPackage";

const ActivitySchema = new Schema({
  description: { type: Schema.Types.String, trim: true },
  time: { type: Schema.Types.String, trim: true },
});

const DaySchema = new Schema({
  dayNumber: {
    type: Schema.Types.Number,
    required: true,
    min: [1, "Day number must be at least 1"],
  },
  activities: {
    type: [ActivitySchema],
    default: [],
  },
});

const ItinerarySchema = new Schema({
  days: {
    type: [DaySchema],
    default: [],
  },
});

const TourPackageSchema: Schema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: [true, "Tour package name is required"],
      trim: true,
    },
    tourType: {
      type: Schema.Types.ObjectId,
      ref: "TourType",
      required: [true, "TourType is required"],
    },
    cancellationPolicy: {
      type: Schema.Types.ObjectId,
      ref: "CancellationPolicy",
      required: [true, "CancellationPolicy is required"],
    },
    touristDestination: {
      type: Schema.Types.ObjectId,
      ref: "TouristDestination",
      required: [true, "TouristDestination is required"],
    },
    duration: {
      type: Schema.Types.Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    selectedDates: {
      type: [Schema.Types.String],
      required: [true, "Selected dates are required"],
    },
    price: {
      type: Schema.Types.Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    itinerary: {
      type: ItinerarySchema,
      required: [true, "Itinerary is required"],
    },
    status: {
      type: Schema.Types.String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    deleted: {
      type: Schema.Types.Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "Tour_Packages",
  }
);

export const TourPackageModel = mongoose.model<ITourPackage>(
  "TourPackage",
  TourPackageSchema
);
