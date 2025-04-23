export class PaymentVo {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly paymentDate: string,
    public readonly paymentMethod: string,
    public readonly transactionId: string,
    public readonly bookingId: string
  ) {}
}
