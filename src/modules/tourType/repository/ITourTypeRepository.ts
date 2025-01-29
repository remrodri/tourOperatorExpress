import { ITourType } from "src/modules/model/tourType/ITourType";
import { CreateTourTypeDto } from "../dto/createTourTypeDto";

export interface ITourTypeRepository {
  createTourType(dto: CreateTourTypeDto): Promise<ITourType>;
  findByName(name: string): Promise<ITourType | null>;
  getAllTourTypes(): Promise<ITourType[]>;
}
