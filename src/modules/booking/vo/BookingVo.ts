export class BookingVo {
  constructor(
    public readonly id: string,
    public readonly touristIds: string[],
    public readonly dateRangeId: string,
    public readonly notes: string,
    public readonly paymentIds: string[],
    public readonly sellerId: string,
    public readonly status: string,
    public readonly totalPrice: number,
    public readonly tourPackageId: string,
    public readonly paymentProofFolder: string
  ) {}
}
