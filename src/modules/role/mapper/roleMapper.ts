import { RoleVo } from "../vo/roleVo";

export const roleMapper = (role: any) => {
  return new RoleVo(role._id.toString(), role.name);
};
