import { PaymentVo } from "src/modules/payment/vo/PaymentVo";

export class BookingVoV2 {
  constructor(
    public readonly id: string,
    public readonly touristIds: string[],
    public readonly dateRangeId: string,
    public readonly notes: string,
    public readonly payments: PaymentVo[],
    public readonly sellerId: string,
    public readonly status: string,
    public readonly totalPrice: number,
    public readonly tourPackageId: string,
    public readonly paymentProofFolder: string,
    public readonly createdAt:string
  ) {}
}
