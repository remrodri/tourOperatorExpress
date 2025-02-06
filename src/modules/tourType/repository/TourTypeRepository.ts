import { ITourType } from "src/modules/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { ITourTypeRepository } from "./ITourTypeRepository";
import { TourTypeModel } from "../../model/tourType/tourTypeModel";
import { TourTypeVo } from "../vo/TourTypeVo";

export class TourTypeRepository implements ITourTypeRepository {
  async softDelete(id: string): Promise<ITourType | null> {
    return await TourTypeModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );
  }
  async findById(id: string): Promise<ITourType | null> {
    return await TourTypeModel.findById(id);
  }
  async updateTourType(
    dto: CreateTourTypeDto,
    id: string
  ): Promise<ITourType | null> {
    // console.log("id::: ", id);
    // console.log("dto::: ", dto);
    // throw new Error("Method not implemented.");
    return await TourTypeModel.findByIdAndUpdate(id, dto, { new: true });
  }
  async getAllTourTypes(): Promise<ITourType[]> {
    return await TourTypeModel.find({ deleted: false }).exec();
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
