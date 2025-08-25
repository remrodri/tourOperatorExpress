import DIContainer from "./DIContainer";
import { PaymentRepository } from "../modules/payment/repository/PaymentRepository";
import { PaymentService } from "../modules/payment/service/PaymentService";
import { BookingService } from "../modules/booking/service/BookingService";
import { TouristService } from "../modules/tourist/service/TouristService";
import { TouristRepository } from "../modules/tourist/repository/TouristRepository";
import { BookingRepository } from "../modules/booking/repository/BookingRepository";
import { PaymentController } from "../modules/payment/controller/PaymentController";
import { BookingController } from "../modules/booking/controller/bookingController";
import { TourPackageService } from "../modules/tourPackage/service/TourPackageService";
import { TourPackageRepository } from "../modules/tourPackage/repository/TourPackageRepository";
import { DateRangeService } from "../modules/dateRange/service/DateRangeService";
import { DateRangeRepository } from "../modules/dateRange/repository/DateRangeRepository";
import { DateRangeController } from "../modules/dateRange/controller/DateRangeController";
import { TourPackageController } from "../modules/tourPackage/controller/TourPackageController";

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
    "tourPackageRepository", 
    () => new TourPackageRepository());

  container.register(
    "dateRangeRepository", 
    () => new DateRangeRepository());

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

  container.register(
    'tourPackageService', 
    (c) => new TourPackageService(
      c.get('tourPackageRepository'),
      c.getLazy('dateRangeService')
    )
  )

  container.register(
    'dateRangeService', 
    (c) => new DateRangeService(
      c.get('dateRangeRepository'),
      c.getLazy('tourPackageService')
    )
  )

  container.register(
    'dateRangeController', 
    (c) => new DateRangeController(
      c.get('dateRangeService')
    )
  )

  container.register(
    'tourPackageController', 
    (c) => new TourPackageController(
      c.get('tourPackageService')
    )
  )

  return container;
}

export default setupDI;

    
