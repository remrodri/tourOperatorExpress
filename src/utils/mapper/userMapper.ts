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
export const userMapper = (user: any) => {
  return new UserVo(
    user._id.toString(),
    user.firstName,
    user.lastName,
    user.email, // email va antes que phone
    user.phone,
    user.ci,
    user.firstLogin,
    user.role.toString(),
    user.deleted ?? false, // agrega deleted
    user.imageUrl ?? "" // valor por defecto si no existe
  );
};