import { NextFunction, Request, Response } from "express";
import { CreateBookingDto } from "../dto/CreateBookingDto";
import { IBookingService } from "../service/IBookingService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { UpdateBookingDto } from "../dto/UpdateBookingDto";
import { UpdateAllDataBookingDto } from "../dto/UpdateAllDataBooking";
import path from "path";
import fs from "fs"

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
      const { paymentProofFolder } = req.body;
      const file = req.file;
      
      let finalFilePath = "";
      
      if (file && paymentProofFolder) {
        // Crear la carpeta final
        const finalDir = path.join(
          __dirname,
          "../../../../uploads/paymentProofs",
          paymentProofFolder
        );
        
        if (!fs.existsSync(finalDir)) {
          fs.mkdirSync(finalDir, { recursive: true });
        }
        
        // Generar nombre del archivo
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `paymentProof-${uniqueSuffix}${fileExtension}`;
        const fullPath = path.join(finalDir, fileName);
        
        // Escribir el archivo desde el buffer de memoria
        fs.writeFileSync(fullPath, file.buffer);
        
        // Ruta relativa para guardar en BD
        finalFilePath = `/uploads/paymentProofs/${paymentProofFolder}/${fileName}`;
      }
      // finalFilePath = finalFilePath || "";
      
      // El resto de tu lógica...
      const bookingData = {
        // ... otros campos
        paymentProofImage: finalFilePath,
        tourPackageId: req.body.tourPackageId,
        dateRangeId:req.body.dateRangeId,
        sellerId: req.body.sellerId,
        status: req.body.status,
        totalPrice: Number(req.body.totalPrice),
        notes: req.body.notes,
        tourists: JSON.parse(req.body.tourists),
        firstPayment: JSON.parse(req.body.firstPayment),
        paymentProofFolder: paymentProofFolder,
      };
      
      // console.log('bookingData::: ', bookingData);
      const dto = CreateBookingDto.parse(bookingData);
      // console.log('dto::: ', dto);
      const vo = await this.bookingService.createAllData(dto);
      // console.log('vo::: ', vo);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("booking created successfully")
        .build();
      res.status(StatusCodes.OK).json(response);
      
    } catch (error) {
      console.error("Error in createBooking::: ", error);
      next(error);
    }
  }

  

  // async createBooking(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> {
  //   try {
  //     // console.log("req::: ", req.body);
  //     const dto = CreateBookingDto.parse(req.body);
  //     // console.log('dto::: ', dto);
  //     const vo = await this.bookingService.createAllData(dto);
  //     const response = new ApiResponseBuilder()
  //       .setStatusCode(StatusCodes.OK)
  //       .setData(vo)
  //       .setMessage("booking created successfully")
  //       .build();
  //     res.status(StatusCodes.OK).json(response);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

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
