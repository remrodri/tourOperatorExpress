import { UserVo } from "../../modules/user/vo/userVo";

// export const userMapper = (user: any) => {
//   return new UserVo(
//     user._id.toString(),
//     user.firstName,
//     user.lastName,
//     user.phone,
//     user.ci,
//     user.email,
//     user.firstLogin,
//     user.role.toString(),
//     user.imageUrl

//   );
// };
export const userMapper = (user: any): UserVo => {
  return new UserVo({
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    ci: user.ci,
    email: user.email,
    firstLogin: user.firstLogin,
    role: user.role.toString(),
    address: user.address ?? "",
    imageUrl: user.imagePath ?? "",
    deleted: user.deleted ?? false,
  });
};