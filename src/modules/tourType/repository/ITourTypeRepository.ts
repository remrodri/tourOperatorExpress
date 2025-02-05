import { ITourType } from "src/modules/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { TourTypeVo } from "../vo/TourTypeVo";

export interface ITourTypeRepository {
  createTourType(dto: CreateTourTypeDto): Promise<ITourType>;
  findByName(name: string): Promise<ITourType | null>;
  getAllTourTypes(): Promise<ITourType[]>;
  updateTourType(dto: CreateTourTypeDto, id: string): Promise<ITourType | null>;
  findById(id: string): Promise<ITourType | null>;
}
