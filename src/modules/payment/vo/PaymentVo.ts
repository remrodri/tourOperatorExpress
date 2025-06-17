export class PaymentVo {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly paymentDate: string,
    public readonly paymentMethod: string,
    public readonly bookingId: string,
    public readonly paymentProofImage: string,
    public readonly sellerId: string,
    public readonly touristId: string
  ) {}
}
