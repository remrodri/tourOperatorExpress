import { ITourType } from "src/modules/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeRepository } from "./ITourTypeRepository";
import { TourTypeModel } from "../../model/tourType/tourTypeModel";
import { TourTypeVo } from "../vo/TourTypeVo";

export class TourTypeRepository implements ITourTypeRepository {
  findById(id: string): Promise<ITourType | null> {
    return TourTypeModel.findById(id);
  }
  updateTourType(
    dto: CreateTourTypeDto,
    id: string
  ): Promise<ITourType | null> {
    // console.log("id::: ", id);
    // console.log("dto::: ", dto);
    // throw new Error("Method not implemented.");
    return TourTypeModel.findByIdAndUpdate(id, dto, { new: true });
  }
  getAllTourTypes(): Promise<ITourType[]> {
    return TourTypeModel.find().exec();
    // throw new Error("Method not implemented.");
  }
  async findByName(name: string): Promise<ITourType | null> {
    const tourTypeFound = await TourTypeModel.findOne({ name: name }).exec();
    return tourTypeFound;
    // throw new Error("Method not implemented.");
  }
  async createTourType(dto: CreateTourTypeDto): Promise<ITourType> {
    const tourType = new TourTypeModel({
      name: dto.name,
      description: dto.description,
    });
    return await tourType.save();
    // console.log("dto::: ", dto);
    // throw new Error("Method not implemented.");
  }
}
