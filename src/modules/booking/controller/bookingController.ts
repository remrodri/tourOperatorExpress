import { NextFunction, Request, Response } from "express";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBookingService } from "../service/IBookingService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";

export class BookingController {
  private readonly bookingService: IBookingService;
  constructor(bookingService: IBookingService) {
    this.bookingService = bookingService;
  }
  async createBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // console.log("req::: ", req.body);
      const dto = CreateBookingDto.parse(req.body);
      // console.log('dto::: ', dto);
      const vo = await this.bookingService.create(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("booking created successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("getAll::: ");
    } catch (error) {
      next(error);
    }
  }
}
