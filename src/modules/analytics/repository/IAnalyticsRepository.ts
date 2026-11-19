export interface AnalyticsPackageReference {
  destinationId: string;
}

export interface AnalyticsDepartureReference {
  tourPackageId: string | null;
}

export interface IAnalyticsRepository {
  findTourPackage(id: string): Promise<AnalyticsPackageReference | null>;
  destinationExists(id: string): Promise<boolean>;
  findDeparture(id: string): Promise<AnalyticsDepartureReference | null>;
}
