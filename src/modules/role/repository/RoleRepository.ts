import { IRole } from "../model/IRole";
import { RoleModel } from "../model/roleModel";
import { IRoleRepository } from "./IRoleRepository";

export class RoleRepository implements IRoleRepository {
  async getAll(): Promise<IRole[]> {
    return await RoleModel.find().exec();
  }
}
