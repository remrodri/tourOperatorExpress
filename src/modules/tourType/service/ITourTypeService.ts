import { CreateTourTypeDto } from "../dto/createTourTypeDto";
import { TourTypeVo } from "../vo/TourTypeVo";
// import { TourTypeVo } from "../vo/tourTypeVo";

export interface ITourTypeService {
  createTourType(dto: CreateTourTypeDto): Promise<any>;
  getAllTourTypes(): Promise<any>;
  updateTourType(dto: CreateTourTypeDto, id: string): Promise<TourTypeVo>;
  softDelete(id:string):Promise<TourTypeVo>
}
