import { Router } from "express";
import { BookingController } from "../controller/BookingController";
import { BookingService } from "../service/BookingService";
import { TouristService } from "../../tourist/service/TouristService";
import { TouristRepository } from "../../tourist/repository/TouristRepository";
import { PaymentService } from "../../payment/service/PaymentService";
import { BookingRepository } from "../repository/BookingRepository";
import { PaymentRepository } from "../../payment/repository/PaymentRepository";

const bookingRouter = Router();

const touristRepository = new TouristRepository();
const touristService = new TouristService(touristRepository);
const paymentRepository = new PaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const bookingRepository = new BookingRepository();
const bookingService = new BookingService(
  touristService,
  paymentService,
  bookingRepository
);
const bookingController = new BookingController(bookingService);

bookingRouter.post("/booking", (req, res, next) =>
  bookingController.createBooking(req, res, next)
);

bookingRouter.get("/booking", (req, res, next) =>
  bookingController.getAllBookings(req, res, next)
);
export default bookingRouter;
