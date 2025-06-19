// import DIContainer from "../../../shared/DIContainer";
// import { PaymentRepository } from "../repository/PaymentRepository";
// import { PaymentService } from "../service/PaymentService";
// import { BookingService } from "src/modules/booking/service/BookingService";
// import { TouristService } from "src/modules/tourist/service/TouristService";
// import { TouristRepository } from "src/modules/tourist/repository/TouristRepository";
// import { BookingRepository } from "src/modules/booking/repository/BookingRepository";
// import { PaymentController } from "../controller/PaymentController";

// function setupDI() {

//   const container = new DIContainer();

//   container.register(
//     "touristRepository", 
//     () => new TouristRepository());
  
//   container.register(
//     "paymentRepository", 
//     () => new PaymentRepository());
    
//   container.register(
//     "bookingRepository", 
//     () => new BookingRepository());

//   container.register(
//     'touristService', 
//     (c) => new TouristService(
//       c.get('touristRepository')
//     )
//   )

//   container.register(
//     'paymentService', 
//     (c) => new PaymentService(
//       c.get('paymentRepository'), 
//       c.get('bookingService')
//     )
//   )

//   container.register(
//     'bookingService', 
//     (c) => new BookingService(
//       c.get('touristService'), 
//       c.get('paymentService'), 
//       c.get('bookingRepository')
//     )
//   )

//   container.register(
//     'paymentController', 
//     (c) => new PaymentController(
//       c.get('paymentService')
//     )
//   )

//   return container;
// }

// export default setupDI;

    
