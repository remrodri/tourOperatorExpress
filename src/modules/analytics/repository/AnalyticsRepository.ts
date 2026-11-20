import { PipelineStage, Types } from "mongoose";
import { BookingModel } from "../../booking/model/BookingModel";
import { DateRangeModel } from "../../dateRange/model/DateRangeModel";
import { PaymentModel } from "../../payment/model/PaymentModel";
import { TourPackageModel } from "../../tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../touristDestination/model/TouristDestinationModel";
import {
  ANALYTICS_INCLUDED_BOOKING_STATUSES,
  AnalyticsFilters,
} from "../types/AnalyticsTypes";
import { buildDepartureCursorFilter } from "../utils/departureCursor";
import {
  AnalyticsDepartureQueryOptions,
  AnalyticsDepartureRaw,
  AnalyticsDepartureReference,
  AnalyticsPackageReference,
  AnalyticsSummaryRaw,
  IAnalyticsRepository,
} from "./IAnalyticsRepository";

const BOOKINGS_COLLECTION = BookingModel.collection.name;
const PAYMENTS_COLLECTION = PaymentModel.collection.name;
const TOUR_PACKAGES_COLLECTION = TourPackageModel.collection.name;
const TOURIST_DESTINATIONS_COLLECTION =
  TouristDestinationModel.collection.name;

const VALID_CAPACITY_EXPRESSION = {
  $and: [
    { $isNumber: "$capacity" },
    { $gt: ["$capacity", 0] },
    { $eq: [{ $mod: ["$capacity", 1] }, 0] },
  ],
};

const mergeMatches = (
  first: Record<string, unknown>,
  second: Record<string, unknown>,
): Record<string, unknown> => {
  const matches = [first, second].filter(
    (match) => Object.keys(match).length > 0,
  );

  if (matches.length === 0) {
    return {};
  }

  if (matches.length === 1) {
    return matches[0];
  }

  return { $and: matches };
};

const nullableReferenceProjection = (field: "tourPackage" | "destination") => ({
  $let: {
    vars: {
      reference: { $ifNull: [`$${field}`, null] },
    },
    in: {
      $cond: [
        { $ne: ["$$reference", null] },
        {
          id: { $toString: "$$reference._id" },
          name: { $ifNull: ["$$reference.name", null] },
        },
        null,
      ],
    },
  },
});

export class AnalyticsRepository implements IAnalyticsRepository {
  async findTourPackage(id: string): Promise<AnalyticsPackageReference | null> {
    const tourPackage = await TourPackageModel.findOne({
      _id: id,
      deleted: { $ne: true },
    })
      .select({ touristDestination: 1 })
      .lean();

    if (!tourPackage) {
      return null;
    }

    return {
      destinationId: tourPackage.touristDestination.toString(),
    };
  }

  async destinationExists(id: string): Promise<boolean> {
    const destination = await TouristDestinationModel.exists({
      _id: id,
      deleted: { $ne: true },
    });

    return Boolean(destination);
  }

  async findDeparture(
    id: string,
  ): Promise<AnalyticsDepartureReference | null> {
    const departure = await DateRangeModel.findOne({ _id: id })
      .select({ tourPackageId: 1 })
      .lean();

    if (!departure) {
      return null;
    }

    return {
      tourPackageId: departure.tourPackageId
        ? departure.tourPackageId.toString()
        : null,
    };
  }

  async findSummary(filters: AnalyticsFilters): Promise<AnalyticsSummaryRaw> {
    const match = await this.buildBaseMatch(filters);
    const pipeline = this.buildMetricsPipeline(match, false);

    pipeline.push({
      $group: {
        _id: null,
        departures: { $sum: 1 },
        tourists: { $sum: "$tourists" },
        bookings: { $sum: "$bookings" },
        reservedRevenue: { $sum: "$reservedRevenue" },
        registeredPayments: { $sum: "$registeredPayments" },
        capacitySum: {
          $sum: {
            $cond: [VALID_CAPACITY_EXPRESSION, "$capacity", 0],
          },
        },
        availableSlotsSum: {
          $sum: {
            $cond: [
              VALID_CAPACITY_EXPRESSION,
              { $max: [{ $subtract: ["$capacity", "$tourists"] }, 0] },
              0,
            ],
          },
        },
        validCapacityDepartures: {
          $sum: { $cond: [VALID_CAPACITY_EXPRESSION, 1, 0] },
        },
        invalidCapacityDepartures: {
          $sum: { $cond: [VALID_CAPACITY_EXPRESSION, 0, 1] },
        },
        overcapacityDepartures: {
          $sum: {
            $cond: [
              {
                $and: [
                  VALID_CAPACITY_EXPRESSION,
                  { $gt: ["$tourists", "$capacity"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        overpaidDepartures: {
          $sum: {
            $cond: [{ $gt: ["$registeredPayments", "$reservedRevenue"] }, 1, 0],
          },
        },
      },
    });

    const [summary] = await DateRangeModel.aggregate<AnalyticsSummaryRaw>(
      pipeline,
    );

    return (
      summary ?? {
        departures: 0,
        tourists: 0,
        bookings: 0,
        reservedRevenue: 0,
        registeredPayments: 0,
        capacitySum: 0,
        availableSlotsSum: 0,
        validCapacityDepartures: 0,
        invalidCapacityDepartures: 0,
        overcapacityDepartures: 0,
        overpaidDepartures: 0,
      }
    );
  }

  async findDepartures(
    filters: AnalyticsFilters,
    options: AnalyticsDepartureQueryOptions,
  ): Promise<AnalyticsDepartureRaw[]> {
    const baseMatch = await this.buildBaseMatch(filters);
    const cursorFilter = buildDepartureCursorFilter(options.cursor);
    const match = mergeMatches(baseMatch, cursorFilter);
    const pipeline = this.buildMetricsPipeline(match, true);

    pipeline.push(
      { $sort: { startDate: 1, _id: 1 } },
      { $limit: options.limit + 1 },
    );

    return DateRangeModel.aggregate<AnalyticsDepartureRaw>(pipeline);
  }

  async findDepartureById(
    id: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsDepartureRaw | null> {
    const baseMatch = await this.buildBaseMatch(filters);
    const match = mergeMatches(baseMatch, {
      _id: new Types.ObjectId(id),
    });
    const pipeline = this.buildMetricsPipeline(match, true);

    pipeline.push({ $limit: 1 });

    const [departure] = await DateRangeModel.aggregate<AnalyticsDepartureRaw>(
      pipeline,
    );

    return departure ?? null;
  }

  private async findTourPackageIdsByDestination(
    destinationId: string,
  ): Promise<string[]> {
    const packages = await TourPackageModel.find({
      touristDestination: destinationId,
      deleted: { $ne: true },
    })
      .select({ _id: 1 })
      .lean();

    return packages.map((tourPackage) => tourPackage._id.toString());
  }

  private async buildBaseMatch(
    filters: AnalyticsFilters,
  ): Promise<Record<string, unknown>> {
    const match: Record<string, unknown> = {};

    if (filters.from || filters.to) {
      const startDate: Record<string, Date> = {};

      if (filters.from) {
        startDate.$gte = new Date(filters.from);
      }

      if (filters.to) {
        startDate.$lte = new Date(filters.to);
      }

      match.startDate = startDate;
    }

    if (filters.dateRangeId) {
      match._id = new Types.ObjectId(filters.dateRangeId);
    }

    if (filters.tourPackageId) {
      match.tourPackageId = new Types.ObjectId(filters.tourPackageId);
    } else if (filters.destinationId) {
      const packageIds = await this.findTourPackageIdsByDestination(
        filters.destinationId,
      );

      match.tourPackageId = {
        $in: packageIds.map((packageId) => new Types.ObjectId(packageId)),
      };
    }

    return match;
  }

  private buildMetricsPipeline(
    match: Record<string, unknown>,
    includeContext: boolean,
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: BOOKINGS_COLLECTION,
          let: { departureId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$dateRangeId", "$$departureId"] },
                status: { $in: [...ANALYTICS_INCLUDED_BOOKING_STATUSES] },
              },
            },
            {
              $project: {
                touristCount: {
                  $size: { $ifNull: ["$touristsIds", []] },
                },
                totalPrice: { $ifNull: ["$totalPrice", 0] },
                paymentIds: {
                  $setUnion: [{ $ifNull: ["$paymentIds", []] }],
                },
              },
            },
          ],
          as: "includedBookings",
        },
      },
      {
        $addFields: {
          bookingCount: { $size: "$includedBookings" },
          tourists: { $sum: "$includedBookings.touristCount" },
          reservedRevenue: { $sum: "$includedBookings.totalPrice" },
          paymentIds: {
            $setUnion: [
              {
                $reduce: {
                  input: "$includedBookings.paymentIds",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: PAYMENTS_COLLECTION,
          localField: "paymentIds",
          foreignField: "_id",
          as: "payments",
        },
      },
      {
        $addFields: {
          registeredPayments: { $sum: "$payments.amount" },
        },
      },
    ];

    if (includeContext) {
      pipeline.push(
        {
          $lookup: {
            from: TOUR_PACKAGES_COLLECTION,
            localField: "tourPackageId",
            foreignField: "_id",
            as: "tourPackage",
          },
        },
        {
          $unwind: {
            path: "$tourPackage",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: TOURIST_DESTINATIONS_COLLECTION,
            localField: "tourPackage.touristDestination",
            foreignField: "_id",
            as: "destination",
          },
        },
        {
          $unwind: {
            path: "$destination",
            preserveNullAndEmptyArrays: true,
          },
        },
      );
    }

    pipeline.push({
      $project: {
        id: { $toString: "$_id" },
        startDate: { $ifNull: ["$startDate", null] },
        endDate: { $ifNull: ["$endDate", null] },
        state: { $ifNull: ["$state", null] },
        dataOrigin: { $ifNull: ["$dataOrigin", null] },
        capacity: { $ifNull: ["$capacity", null] },
        tourists: { $ifNull: ["$tourists", 0] },
        bookings: { $ifNull: ["$bookingCount", 0] },
        reservedRevenue: { $ifNull: ["$reservedRevenue", 0] },
        registeredPayments: { $ifNull: ["$registeredPayments", 0] },
        tourPackage: includeContext
          ? nullableReferenceProjection("tourPackage")
          : null,
        destination: includeContext
          ? nullableReferenceProjection("destination")
          : null,
      },
    });

    return pipeline;
  }
}
