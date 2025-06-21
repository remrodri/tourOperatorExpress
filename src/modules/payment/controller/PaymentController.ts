import { NextFunction, Request, Response } from "express";
import { IPaymentService } from "../service/IPaymentService";
import { ApiResponseBuilder } from "../../../utils/response/apiResponseBuilder";
import { StatusCodes } from "http-status-codes";
import { CreatePaymentDto } from "../dto/CreatePaymentDto";
import path from "path";
import fs from 'fs';
export class PaymentController {
  private readonly paymentService: IPaymentService;
  constructor(paymentService: IPaymentService) {
    this.paymentService = paymentService;
  }

  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const vos = await this.paymentService.getAll();
      // console.log('vos::: ', vos);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vos)
        .setMessage("payments found succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req: Request, res: Response, next: NextFunction) {
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
        
        // Guardar el archivo
        fs.writeFileSync(fullPath, file.buffer);
        finalFilePath = `/uploads/paymentProofs/${paymentProofFolder}/${fileName}`;
      }
      const paymentData = {
        ...req.body,
        amount: Number(req.body.amount),
        paymentProofImage: finalFilePath,
      }
      const dto = CreatePaymentDto.parse(paymentData);
      // console.log('dto::: ', dto);
      const vo = await this.paymentService.createSinglePayment(dto);
      const response = new ApiResponseBuilder()
        .setStatusCode(StatusCodes.OK)
        .setData(vo)
        .setMessage("payment created succesfully")
        .build();
      res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
