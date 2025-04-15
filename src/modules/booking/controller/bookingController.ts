import { NextFunction, Request, Response } from "express";

export class BookingController {
  async createBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("req::: ", req.body);
    } catch (error) {
      next(error);
    }
  }
}
