import { ITouristService } from "./ITouristService";
import { TouristVo } from "../vo/TouristVo";
import { ITouristRepository } from "../repository/ITouristRepository";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { HttpException } from "../../../middleware/httpException";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ITourist } from "../model/ITourist";
import { UpdateTouristDto } from "../dto/UpdateTouristDto";
import { TouristFeedQueryDto } from "../dto/TouristFeedQueryDto";
import {
  decodeCursor,
  encodeCursor,
} from "../../../utils/pagination/cursorPagination";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class TouristService implements ITouristService {
  private readonly touristRepository: ITouristRepository;

  constructor(touristRepository: ITouristRepository) {
    this.touristRepository = touristRepository;
  }
  async updateTourist(
    id: string,
    tourist: UpdateTouristDto
  ): Promise<TouristVo> {
    try {
      const updatedTouristDoc = await this.touristRepository.updateDB(
        // tourist.id!,
        id,
        tourist
      );
      if (!updatedTouristDoc) {
        throw new Error("Tourist update returned null or undefined");
      }
      const updatedTouristVo = this.mapToVo(updatedTouristDoc);
      return updatedTouristVo;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar el turista: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar el turista");
      }
    }
  }
  async getById(id: string): Promise<TouristVo | null> {
    const tourist = await this.touristRepository.getByIdDB(id);
    if (!tourist) {
      return null;
    }
    return this.mapToVo(tourist);
  }
  async update(
    id: string,
    tourist: Partial<UpdateTouristDto>,
    session: mongoose.ClientSession
  ): Promise<TouristVo | null> {
    // console.log('UpdateTouristDto::: ', tourist);
    try {
      if (!session) {
        throw new Error("Session is required for transaction");
      }
      const existingTourist = await this.touristRepository.getByIdDB(id);
      if (!existingTourist) {
        throw new Error("Tourist not found");
      }
      const touristFound = await this.touristRepository.getByIdDB(id);
      // console.log('touristFound::: ', touristFound);
      if (!touristFound) {
        throw new Error("Tourist not found");
      }
      const updatedTouristDoc = await this.touristRepository.updateDB(
        id,
        tourist,
        session
      );
      // console.log('updatedTouristDoc::: ', updatedTouristDoc);
      if (!updatedTouristDoc) {
        throw new Error("Tourist update returned null or undefined");
      }
      return this.mapToVo(updatedTouristDoc);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al actualizar el turista: ${error.message}`);
      } else {
        throw new Error("Error desconocido al actualizar el turista");
      }
    }
  }

  async getAll(): Promise<TouristVo[]> {
    const touristDocs = await this.touristRepository.getAllDB();
    if (!touristDocs || touristDocs.length === 0) {
      return [];
    }
    return touristDocs.map((tourist) => this.mapToVo(tourist));
  }
  async getFeed(dto: TouristFeedQueryDto): Promise<{
    items: TouristVo[];
    pagination: { nextCursor: string | null; hasMore: boolean };
  }> {
    const filter: Record<string, unknown> = {};
    if (dto.search) {
      const regex = {
        $regex: escapeRegex(dto.search),
        $options: "i",
      };
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { ci: regex },
        { passportNumber: regex },
        { phone: regex },
      ];
    }

    const cursor = decodeCursor(dto.cursor);
    const touristDocs = await this.touristRepository.getFeedDB(
      filter,
      cursor,
      dto.limit
    );
    const hasMore = touristDocs.length > dto.limit;
    const visible = hasMore ? touristDocs.slice(0, dto.limit) : touristDocs;
    const last = visible.at(-1);

    return {
      items: visible.map((tourist) => this.mapToVo(tourist)),
      pagination: {
        nextCursor:
          hasMore && last
            ? encodeCursor(last.createdAt as Date, last._id)
            : null,
        hasMore,
      },
    };
  }

  async getByIds(ids: string[]): Promise<TouristVo[]> {
    const touristDocs = await this.touristRepository.getByIdsDB(ids);
    return touristDocs.map((tourist) => this.mapToVo(tourist));
  }

  async count(): Promise<number> {
    return this.touristRepository.countDB();
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
  ): Promise<TouristVo> {
    try {
      const updatedTouristDoc =
        await this.touristRepository.addBookingToTourist(
          touristId,
          bookingId,
          session
        );
      if (!updatedTouristDoc) {
        throw new Error("Tourist update returned null or undefined");
      }
      return this.mapToVo(updatedTouristDoc);
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
