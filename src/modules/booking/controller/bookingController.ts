import { NextFunction, Request, Response } from "express";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBookingService } from "../service/IBookingService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";

export class BookingController {
  private readonly bookingService: IBookingService;
  constructor(bookingService: IBookingService) {
    this.bookingService = bookingService;
  }

  async updateBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log('req.body::: ', req.body);
    try {
      const dto = UpdateAllDataBookingDto.parse(req.body);
      console.log('dto::: ', dto);
      const vo = await this.bookingService.updateAllData(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("booking updated successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
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
      const vo = await this.bookingService.createAllData(dto);
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
      const vos = await this.bookingService.getAll();
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("Bookings found succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
