import { ClientSession, startSession } from "mongoose";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import { PaymentVo } from "../vo/PaymentVo";
import { IPaymentService } from "./IPaymentService";
import { IPaymentRepository } from "../repository/IPaymentRepository";
import { IPayment } from "../model/IPayment";
import { IBookingService } from "src/modules/booking/service/IBookingService";

export class PaymentService implements IPaymentService {
  private readonly paymentRepository: IPaymentRepository;
  private readonly bookingService: IBookingService;

  constructor(paymentRepository: IPaymentRepository, bookingService: IBookingService) {
    this.paymentRepository = paymentRepository;
    this.bookingService = bookingService;
  }
  async createSinglePayment(dto: CreatePaymentDto): Promise<PaymentVo> {
    const session = await startSession();
    
    try {
      let paymentCreated: any;
      
      await session.withTransaction(async () => {
        // Crear el payment
        paymentCreated = await this.paymentRepository.createDB(dto, session);
        if (!paymentCreated) {
          throw new Error("creacion del payment retorno null");
        }
        
        if (!dto.bookingId) {
          throw new Error("El id de la reserva es requerida para crear un pago");
        }
        
        // IMPORTANTE: Obtener el booking dentro de la transacción usando la session
        const booking = await this.bookingService.getById(dto.bookingId, session);
        
        // Actualizar el booking
        await this.bookingService.update(
          dto.bookingId,
          { paymentIds: [...(booking.paymentIds || []), paymentCreated._id.toString()] },
          session
        );
        
        // withTransaction maneja automáticamente el commit/abort
      });
      
      return this.mapToVo(paymentCreated);
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear pago: ${error.message}`);
      } else {
        throw new Error("Error desconocido al crear pago");
      }
    } finally {
      await session.endSession();
    }
  }
  
  async getAll(): Promise<PaymentVo[]> {
    const paymentDocs = await this.paymentRepository.getAllDB();
    // console.log('paymentDocs::: ', paymentDocs);
    const vos = paymentDocs.map((payment) => this.mapToVo(payment));
    // console.log('vos::: ', vos);
    return vos;
  }
  mapToVo(payment: IPayment|null): PaymentVo {
    if (!payment) {
      throw new Error("payment es null");
    }
    return new PaymentVo(
      payment._id.toString(),
      payment.amount,
      payment.paymentDate,
      payment.paymentMethod,
      payment.bookingId,
      payment.paymentProofImage,
      payment.sellerId,
      payment.touristId
    );
  }

  async create(
    dto: CreatePaymentDto,
    session?: ClientSession
  ): Promise<PaymentVo> {
    try {
      if (!dto.bookingId) {
        throw new Error("El id de la reserva es requerida para crear un pago");
      }
      const payment = await this.paymentRepository.createDB(dto, session);
      if (!payment) {
        throw new Error("creacion del payment retorno null");
      }
      return this.mapToVo(payment);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear pago: ${error.message}`);
      } else {
        throw new Error("Error desconocido al crear pago");
      }
    }
  }
}
