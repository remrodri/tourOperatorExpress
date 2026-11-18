import mongoose, { QueryOptions } from "mongoose";
import { CreateTouristDto } from "../dto/CreateTouristDto";
import { ITourist } from "../model/ITourist";
import { TouristModel } from "../model/TouristModel";
import { ITouristRepository } from "./ITouristRepository";
import { UpdateTouristDto } from "../dto/UpdateTouristDto";
import { CursorValue } from "../../../utils/pagination/cursorPagination";

export class TouristRepository implements ITouristRepository {
  updateWithoutSessionDB(
    id: string,
    tourist: Partial<UpdateTouristDto>
  ): Promise<ITourist | null> {
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
    // console.log('tourist::: ', tourist);
    // const options: QueryOptions = { new: true };
    // return await TouristModel.findByIdAndUpdate(id, tourist, options);
    // console.log('Session in updateDB:', session?.transaction);
    // if (session) options["session"] = session;
    // console.log("Updating tourist ID:", id);
    // console.log("With data:", tourist);
    let touristUpdated = null;
    if (session) {
      touristUpdated = await TouristModel.findByIdAndUpdate(
        id,
        tourist,
        // options
        { new: true, session: session }
      );
    } else {
      touristUpdated = await TouristModel.findByIdAndUpdate(
        id,
        tourist,
        // options
        { new: true }
      );
    }
    // const updatedTourist = await TouristModel.findByIdAndUpdate(
    //   id,
    //   tourist,
    //   // options
    //   { new: true, session: session }
    // );
    // if (!updatedTourist) {
    // throw new Error(`Turista con ID ${id} no encontrado`);
    // }
    // if (!session) {

    // }
    // console.log('updatedTourist::: ', updatedTourist);
    return touristUpdated;
  }

  async getAllDB(): Promise<ITourist[]> {
    return await TouristModel.find().exec();
  }

  async getFeedDB(
    filter: Record<string, unknown>,
    cursor: CursorValue | null,
    limit: number
  ): Promise<ITourist[]> {
    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
          ],
        }
      : {};

    return TouristModel.find({ ...filter, ...cursorFilter })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec() as unknown as Promise<ITourist[]>;
  }

  async getByIdsDB(ids: string[]): Promise<ITourist[]> {
    return TouristModel.find({ _id: { $in: ids } })
      .lean()
      .exec() as unknown as Promise<ITourist[]>;
  }

  async countDB(): Promise<number> {
    return TouristModel.countDocuments().exec();
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
    const tourist = new TouristModel({ ...dto });
    // console.log('tourist::: ', tourist);
    const savedTourist = session
      ? await tourist.save({ session })
      : await tourist.save();

    // console.log('savedTourist::: ', savedTourist);
    return savedTourist;
    // return await tourist.save();
  }
}
