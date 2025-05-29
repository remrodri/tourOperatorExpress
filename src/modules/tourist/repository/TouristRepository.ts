import mongoose, { QueryOptions } from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";
import { TouristModel } from "../model/TouristModel";
import { ITouristRepository } from "./ITouristRepository";
import { UpdateTouristDto } from "../dto/UpdateTourist";

export class TouristRepository implements ITouristRepository {
  updateWithoutSessionDB(id: string, tourist: Partial<UpdateTouristDto>): Promise<ITourist | null> {
    return TouristModel.findByIdAndUpdate(id, tourist, { new: true }).exec();
  }
  getByIdDB(id: string): Promise<ITourist | null> {
    return TouristModel.findById(id).exec();
  }
  async updateDB(
    id: string,
    tourist: Partial<UpdateTouristDto>,
    session?: mongoose.ClientSession
  ): Promise<ITourist | null> {
    const options: QueryOptions = { new: true };
    // return await TouristModel.findByIdAndUpdate(id, tourist, options);
    if (session) options["session"] = session;
    const updatedTourist = await TouristModel.findByIdAndUpdate(
      id,
      tourist,
      options
    );
    if (!updatedTourist) {
      throw new Error(`Turista con ID ${id} no encontrado`);
    }
    return updatedTourist;
  }

  async getAllDB(): Promise<ITourist[]> {
    return await TouristModel.find().exec();
  }
  async addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<ITourist | null> {
    const options: QueryOptions = { new: true };
    if (session) options["session"] = session;
    const updatedTourist = await TouristModel.findByIdAndUpdate(
      touristId,
      {
        $addToSet: { bookingIds: bookingId },
      },
      options
    );
    if (!updatedTourist) {
      throw new Error(`Turista con ID ${touristId} no encontrado`);
    }
    return updatedTourist;
  }
  async findByEmail(email: string): Promise<ITourist | null> {
    const tourist = await TouristModel.findOne({ email });
    return tourist;
  }
  async createDB(
    dto: CreateTouristDto,
    session?: mongoose.ClientSession
  ): Promise<ITourist> {
    const tourist = new TouristModel({ ...dto, bookingIds: [] });
    console.log('tourist::: ', tourist);

    const savedTourist = session
    ? await tourist.save({ session })
    : await tourist.save();
    
    console.log('savedTourist::: ', savedTourist);
    return savedTourist;
    // return await tourist.save();
  }
}
