import { ITouristService } from "./ITouristService";
import { TouristVo } from "../vo/TouristVo";
import { ITouristRepository } from "../repository/ITouristRepository";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { HttpException } from "../../../middleware/httpException";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTourist";

export class TouristService implements ITouristService {
  private readonly touristRepository: ITouristRepository;

  constructor(touristRepository: ITouristRepository) {
    this.touristRepository = touristRepository;
  }
  async update(
    id: string,
    tourist: UpdateTouristDto,
    session: mongoose.ClientSession
  ): Promise<TouristVo> {
    throw new Error("Method not implemented.");
  }

  async getAll(): Promise<TouristVo[]> {
    const touristDocs = await this.touristRepository.getAllDB();
    if (!touristDocs || touristDocs.length === 0) {
      return [];
    }
    return touristDocs.map((tourist) => this.mapToVo(tourist));
  }
  mapToVo(tourist: ITourist): TouristVo {
    return new TouristVo(
      tourist._id.toString(),
      tourist.firstName,
      tourist.lastName,
      tourist.phone,
      tourist.email,
      tourist.nationality,
      tourist.documentType,
      tourist.ci,
      tourist.passportNumber,
      tourist.dateOfBirth,
      tourist.bookingIds
    );
  }
  async addBookingToTourist(
    touristId: string,
    bookingId: string,
    session: any
  ): Promise<void> {
    try {
      await this.touristRepository.addBookingToTourist(
        touristId,
        bookingId,
        session
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al crear el turista ${error.message}`);
      } else {
        throw new Error(`Error desconocido al crear el turista`);
      }
    }
  }
  async create(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<TouristVo> {
    try {
      const existingTourist = await this.touristRepository.findByEmail(
        dto.email
      );
      if (existingTourist) {
        return this.mapToVo(existingTourist);
      }
      const touristCreated = await this.touristRepository.createDB(
        dto,
        session
      );
      if (!touristCreated) {
        throw new Error("Tourist creation returned null or undefined");
      }
      // console.log("touristCreated::: ", touristCreated);

      return this.mapToVo(touristCreated);
    } catch (error) {
      console.error(`Error al crear al turista: ${error}`);
      if (error instanceof Error) {
        throw new Error(`Error al crear al turista: ${error.message}`);
      } else {
        throw new Error(`Error al crear al turista: ${error}`);
      }
    }
  }
}
