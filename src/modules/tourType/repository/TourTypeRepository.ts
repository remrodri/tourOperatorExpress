import { ITourType } from "src/modules/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeRepository } from "./ITourTypeRepository";
import { TourTypeModel } from "../../model/tourType/tourTypeModel";

export class TourTypeRepository implements ITourTypeRepository {
  async findByName(name: string): Promise<ITourType | null> {
    const tourTypeFound = await TourTypeModel.findOne({ name: name }).exec();
    return tourTypeFound;
    // throw new Error("Method not implemented.");
  }
  async createTourType(dto: CreateTourTypeDto): Promise<ITourType> {
    const tourType = new TourTypeModel({
      name: dto.name,
      description: dto.description,
    })
    return await tourType.save();
    // console.log("dto::: ", dto);
    // throw new Error("Method not implemented.");
  }
}
