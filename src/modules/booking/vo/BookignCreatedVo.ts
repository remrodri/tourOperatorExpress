import { PaymentVo } from "src/modules/payment/vo/PaymentVo";
import { TouristVo } from "src/modules/tourist/vo/TouristVo";

export class BookingCreatedVo {
  constructor(
    public readonly id: string,
    public readonly tourists: TouristVo[],
    public readonly dateRangeId: string,
    public readonly notes: string,
    public readonly payments: PaymentVo[],
    public readonly sellerId: string,
    public readonly status: string,
    public readonly totalPrice: number,
    public readonly tourPackageId: string,
    public readonly paymentProofFolder: string,
    public readonly attendance: {
      touristId: string;
      status: string;
    }[],
    public readonly cancellationFee: number,
    public readonly refundAmount: number,
    public readonly refundedAt: string,
  ) {}
}
