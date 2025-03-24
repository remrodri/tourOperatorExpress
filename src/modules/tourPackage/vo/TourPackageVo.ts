import { DateRangeVo } from "src/modules/dateRange/vo/DateRangeVo";

export class TourPackageVo {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tourType: string,
    public readonly cancellationPolicy: string,
    public readonly touristDestination: string,
    public readonly duration: number,
    public readonly dateRanges: {id:string}[],
    // public readonly dateRanges: {
    //   id: string;
    //   dates: string[];
    //   state: string;
    // }[],
    public readonly price: number,
    public readonly itinerary: {
      days: {
        dayNumber: number;
        activities: {
          description: string;
          time: string;
        }[];
      }[];
    },
    public readonly status: string
  ) {}
}
