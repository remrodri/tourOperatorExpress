import mongoose, { QueryOptions } from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";
import { TouristModel } from "../model/TouristModel";
import { ITouristRepository } from "./ITouristRepository";

export class TouristRepository implements ITouristRepository {
  async addBookingToTourist(
    touristId: string,
    bookingId: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
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
    
    const savedTourist = session
    ? await tourist.save({ session })
    : await tourist.save();
    
    return savedTourist;
    // return await tourist.save();
  }
}
