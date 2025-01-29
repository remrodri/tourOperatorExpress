import { UserVo } from "../../modules/user/vo/userVo";

export const userMapper = (user: any) => {
  return new UserVo(
    user._id.toString(),
    user.firstName,
    user.lastName,
    user.phone,
    user.ci,
    user.email,
    user.firstLogin,
    user.role.toString(),
    user.imageUrl
  );
};
