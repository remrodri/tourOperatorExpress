import { Router } from "express";
import { BookingController } from "../controller/bookingController";

const bookingRouter = Router();

const bookingController = new BookingController();

bookingRouter.post("/booking", (req, res, next) =>
  bookingController.createBooking(req, res, next)
);
export default bookingRouter;
