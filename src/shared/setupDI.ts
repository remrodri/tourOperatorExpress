import DIContainer from "./DIContainer";
import { PaymentRepository } from "../modules/payment/repository/PaymentRepository";
import { PaymentService } from "../modules/payment/service/PaymentService";
import { BookingService } from "../modules/booking/service/BookingService";
import { TouristService } from "../modules/tourist/service/TouristService";
import { TouristRepository } from "../modules/tourist/repository/TouristRepository";
import { BookingRepository } from "../modules/booking/repository/BookingRepository";
import { PaymentController } from "../modules/payment/controller/PaymentController";
import { BookingController } from "../modules/booking/controller/bookingController";

function setupDI() {

  const container = new DIContainer();

  container.register(
    "touristRepository", 
    () => new TouristRepository());
  
  container.register(
    "paymentRepository", 
    () => new PaymentRepository());
    
  container.register(
    "bookingRepository", 
    () => new BookingRepository());

  container.register(
    'touristService', 
    (c) => new TouristService(
      c.get('touristRepository')
    )
  )

  container.register(
    'paymentService', 
    (c) => new PaymentService(
      c.get('paymentRepository'), 
      c.getLazy('bookingService')
    )
  )

  container.register(
    'bookingService', 
    (c) => new BookingService(
      c.get('touristService'), 
      c.getLazy('paymentService'), 
      c.get('bookingRepository')
    )
  )

  container.register(
    'paymentController', 
    (c) => new PaymentController(
      c.get('paymentService')
    )
  )

  container.register(
    'bookingController', 
    (c) => new BookingController(
      c.get('bookingService')
    )
  )

  return container;
}

export default setupDI;

    
