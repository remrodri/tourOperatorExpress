export class BookingVo {
  constructor(
    public readonly id: string,
    public readonly additionalTouristIds: string[],
    public readonly dateRangeId: string,
    public readonly mainTouristId: string,
    public readonly notes: string,
    public readonly paymentIds: string[],
    public readonly sellerId: string,
    public readonly status: string,
    public readonly totalPrice: number,
    public readonly tourPackageId: string
  ) {}
}
