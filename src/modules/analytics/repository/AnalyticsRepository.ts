import { DateRangeModel } from "../../dateRange/model/DateRangeModel";
import { TourPackageModel } from "../../tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../touristDestination/model/TouristDestinationModel";
import {
  AnalyticsDepartureReference,
  AnalyticsPackageReference,
  IAnalyticsRepository,
} from "./IAnalyticsRepository";

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
}
