import { PaymentVo } from "src/modules/payment/vo/PaymentVo";
import { TouristVo } from "src/modules/tourist/vo/TouristVo";

export class BookingUpdatedVo {
  constructor(
    public readonly id: string,
    public readonly additionalTourists: TouristVo[],
    public readonly dateRangeId: string,
    public readonly mainTourist: TouristVo,
    public readonly notes: string,
    // public readonly payments: PaymentVo[],
    public readonly sellerId: string,
    public readonly status: string,
    public readonly totalPrice: number,
    public readonly tourPackage: string
  ) {}
}
