import path from "path";
import { HttpException } from "../../../middleware/httpException";
import { TouristDestinationDto } from "../dto/TouristDestinationDto";
import { ITouristDestinationRepository } from "../repository/ITouristDestinationRepository";
import { TouristDestinationVo } from "../vo/TouristDestinationVo";
import { ITouristDestinationService } from "./ITouristDestinationService";
import { StatusCodes } from "http-status-codes";
import fs from "fs";
import { UpdateTouristDestinationDto } from "../dto/updateTouristDestinationDto";
import { DeleteTouristDestinationDto } from "../dto/deleteTouristDestinationDto";
import { DeletedTouristDestinationVo } from "../vo/deletedTouristDestinationVo";

export class TouristDestinationService implements ITouristDestinationService {
  private readonly touristDestinationRepository: ITouristDestinationRepository;

  constructor(touristDestinationRepository: ITouristDestinationRepository) {
    this.touristDestinationRepository = touristDestinationRepository;
  }
  async softDeleteTouristDestination(
    dto: DeleteTouristDestinationDto
  ): Promise<DeletedTouristDestinationVo> {
    const deleted = await this.touristDestinationRepository.softDeleteDB(dto);
    if (!deleted) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "Tourist destination not found"
      );
    }
    return new DeletedTouristDestinationVo(deleted._id.toString());
  }
  async updateTouristDestination(
    id: string,
    dto: UpdateTouristDestinationDto,
    existingImages: string[],
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo> {
    const destination = await this.touristDestinationRepository.findByIdDB(id);
    if (!destination) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "TouristDestination not found"
      );
    }
    destination.name = dto.name;
    destination.description = dto.description;

    const newImagePaths = files.map(
      (file) =>
        `/uploads/destinations/${destination.imageFolder}/${file.filename}`
    );
    destination.images = [...existingImages, ...newImagePaths];

    const updatedTouristDestination =
      await this.touristDestinationRepository.updateDB(id, destination);
    if (!updatedTouristDestination) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Error updating destinations"
      );
    }

    const existingImagesSet = new Set(existingImages);
    const imagesToDelete = destination.images.filter(
      (image) => !existingImagesSet.has(image)
    );

    imagesToDelete.forEach((imagePath) => {
      const absolutePath = path.join(__dirname, "..", imagePath);
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    });
    return new TouristDestinationVo(
      updatedTouristDestination._id.toString(),
      updatedTouristDestination.name,
      updatedTouristDestination.description,
      updatedTouristDestination.imageFolder,
      updatedTouristDestination.images,
      updatedTouristDestination.deleted
    );

    throw new Error("Method not implemented.");
  }
  async getAllTouristDestinations(): Promise<TouristDestinationVo[]> {
    const touristDestinations =
      await this.touristDestinationRepository.getAllDB();
    if (!touristDestinations) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        "TouristDestinations not found"
      );
    }
    const vos = touristDestinations.map(
      (touristDestination) =>
        new TouristDestinationVo(
          touristDestination._id.toString(),
          touristDestination.name,
          touristDestination.description,
          touristDestination.imageFolder,
          touristDestination.images,
          touristDestination.deleted
        )
    );
    return vos;
    // throw new Error("Method not implemented.");
  }

  async createTouristDestination(
    dto: TouristDestinationDto,
    files: Express.Multer.File[]
  ): Promise<TouristDestinationVo> {
    // console.log("dto::: ", dto);
    // console.log('files::: ', files);
    const images = files.map(
      (file) => `/uploads/destinations/${dto.imageFolder}/${file.filename}`
    );
    dto.images = images;
    const response = await this.touristDestinationRepository.createDB(dto);
    if (!response) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
    // console.log('response::: ', response);
    const vo = new TouristDestinationVo(
      response._id.toString(),
      response.name,
      response.description,
      response.imageFolder,
      response.images,
      response.deleted
    );
    return vo;
    // throw new Error("Method not implemented.");
  }
}
