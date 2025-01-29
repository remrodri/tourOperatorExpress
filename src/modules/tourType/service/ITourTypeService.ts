import { CreateTourTypeDto } from "../dto/createTourTypeDto";

export interface ITourTypeService {
  createTourType(dto: CreateTourTypeDto): Promise<any>;
}
