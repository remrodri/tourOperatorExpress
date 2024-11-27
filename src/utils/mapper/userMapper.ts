import { UserVo } from "../../modules/userManagement/vo/userVo";

export const userMapper = (user: any) => {
  return new UserVo(
    user._id.toString(),
    user.firstName,
    user.lastName,
    user.phone,
    user.email,
    user.ci,
    user.firstLogin,
    user.role.toString()
  );
};
