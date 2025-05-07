import { ClientSession } from "mongoose";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { PaymentVo } from "../vo/PaymentVo";
import { IPaymentService } from "./IPaymentService";
import { IPaymentRepository } from "../repository/IPaymentRepository";
import { IPayment } from "../model/IPayment";

export class PaymentService implements IPaymentService {
  private readonly paymentRepository: IPaymentRepository;
  constructor(paymentRepository: IPaymentRepository) {
    this.paymentRepository = paymentRepository;
  }
  async getAll(): Promise<PaymentVo[]> {
    const paymentDocs = await this.paymentRepository.getAllDB();
    return paymentDocs.map((payment) => this.mapToVo(payment));
  }
  mapToVo(payment: IPayment): PaymentVo {
    return new PaymentVo(
      payment._id.toString(),
      payment.amount,
      payment.paymentDate,
      payment.paymentMethod,
      payment.transactionId,
      payment.bookingId.toString()
    );
  }

  async create(
    dto: CreatePaymentDto,
    session?: ClientSession
  ): Promise<PaymentVo> {
    // console.log('dto::: ', dto);
    try {
      if (!dto.bookingId) {
        throw new Error("El id de la reserva es requeirdo para crear un pago");
      }
      const payment = await this.paymentRepository.createDB(dto, session);
      // console.log("payment::: ", payment);
      if (!payment) {
        throw new Error("creacion del payment retorno null");
      }
      return this.mapToVo(payment);
    } catch (error) {
      throw new Error(`Error al crear pago: ${error}`);
    }
  }
}
