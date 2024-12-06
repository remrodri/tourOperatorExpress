import { roleMapper } from "../mapper/roleMapper";
import { IRoleRepository } from "../repository/IRoleRepository";
import { RoleVo } from "../vo/roleVo";
import { IRoleService } from "./IRoleService";

export class RoleService implements IRoleService {
  private readonly roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  async getAllRoles(): Promise<RoleVo[]> {
    const roles = await this.roleRepository.getAll();
    return roles.map((role) => roleMapper(role));
  }
}
