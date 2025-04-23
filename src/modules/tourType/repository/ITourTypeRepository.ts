import { ITourType } from "src/modules/tourType/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { TourTypeVo } from "../vo/TourTypeVo";

export interface ITourTypeRepository {
  softDelete(id: string): Promise<ITourType | null>;
  createTourType(dto: CreateTourTypeDto): Promise<ITourType>;
  findByName(name: string): Promise<ITourType | null>;
  getAllTourTypes(): Promise<ITourType[]>;
  updateTourType(dto: CreateTourTypeDto, id: string): Promise<ITourType | null>;
  findById(id: string): Promise<ITourType | null>;
}
