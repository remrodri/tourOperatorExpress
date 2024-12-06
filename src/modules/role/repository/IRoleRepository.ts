import { IRole } from "../../model/role/IRole";

export interface IRoleRepository {
  getAll(): Promise<IRole[]>;
}
