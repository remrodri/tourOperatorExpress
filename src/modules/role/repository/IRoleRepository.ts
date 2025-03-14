import { IRole } from "../model/IRole";

export interface IRoleRepository {
  getAll(): Promise<IRole[]>;
}
