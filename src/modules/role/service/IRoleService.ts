import { RoleVo } from "../vo/roleVo";

export interface IRoleService {
  getAllRoles(): Promise<RoleVo[]>;
}
