import { Types } from "mongoose";
import { BookingModel } from "../../booking/model/BookingModel";
import { DateRangeModel } from "../../dateRange/model/DateRangeModel";
import { TourPackageModel } from "../../tourPackage/model/TourPackageModel";
import {
  PredictiveDatasetInputs,
  PredictiveDatasetPackage,
} from "./PredictiveDatasetTypes";

const toStringId = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return null;
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const toNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const loadPredictiveDatasetInputs =
  async (): Promise<PredictiveDatasetInputs> => {
    const [departures, bookings, packages] = await Promise.all([
      DateRangeModel.find({})
        .select({
          _id: 1,
          startDate: 1,
          endDate: 1,
          capacity: 1,
          tourPackageId: 1,
          dataOrigin: 1,
          simulationId: 1,
          simulationVersion: 1,
          simulationSeed: 1,
        })
        .lean()
        .exec(),
      BookingModel.find({})
        .select({
          dateRangeId: 1,
          status: 1,
          touristsIds: 1,
          createdAt: 1,
        })
        .lean()
        .exec(),
      TourPackageModel.find({})
        .select({
          _id: 1,
          touristDestination: 1,
          tourType: 1,
          duration: 1,
          price: 1,
        })
        .lean()
        .exec(),
    ]);

    return {
      departures: departures.map((departure) => ({
        id: departure._id.toString(),
        startDate: toDate(departure.startDate),
        endDate: toDate(departure.endDate),
        capacity: toNumber(departure.capacity),
        tourPackageId: toStringId(departure.tourPackageId),
        dataOrigin:
          typeof departure.dataOrigin === "string"
            ? departure.dataOrigin
            : null,
        simulationId:
          typeof departure.simulationId === "string"
            ? departure.simulationId
            : null,
        simulationVersion:
          typeof departure.simulationVersion === "string"
            ? departure.simulationVersion
            : null,
        simulationSeed: toNumber(departure.simulationSeed),
      })),
      bookings: bookings.map((booking) => ({
        departureId: toStringId(booking.dateRangeId) ?? "",
        status: typeof booking.status === "string" ? booking.status : "",
        tourists: Array.isArray(booking.touristsIds)
          ? booking.touristsIds.length
          : 0,
        createdAt: toDate(booking.createdAt),
      })),
      packages: packages.map(
        (tourPackage): PredictiveDatasetPackage => ({
          id: tourPackage._id.toString(),
          destinationId: toStringId(tourPackage.touristDestination),
          tourTypeId: toStringId(tourPackage.tourType),
          durationDays: toNumber(tourPackage.duration),
          price: toNumber(tourPackage.price),
        }),
      ),
    };
  };
