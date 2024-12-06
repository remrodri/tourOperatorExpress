import { IRole } from "../../model/role/IRole";
import { RoleModel } from "../../model/role/roleModel";
import { IRoleRepository } from "./IRoleRepository";

export class RoleRepository implements IRoleRepository {
  async getAll(): Promise<IRole[]> {
    return await RoleModel.find().exec();
  }
}
