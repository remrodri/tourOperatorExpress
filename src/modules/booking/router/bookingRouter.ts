import { Router } from "express";
import { container } from "../../../shared/container";
import { BookingController } from "../controller/bookingController";
import upload from "../multer/memoryPaymentImage";

const bookingRouter = Router();

const bookingController: BookingController = container.get('bookingController');

bookingRouter.post("/bookings", upload.single('paymentProofImage'), (req, res, next) =>
  bookingController.createBooking(req, res, next)
);

bookingRouter.get("/bookings", (req, res, next) =>
  bookingController.getAllBookings(req, res, next)
);

bookingRouter.put("/bookings/:id", (req, res, next) =>
  bookingController.updateBooking(req, res, next)
);
export default bookingRouter;
