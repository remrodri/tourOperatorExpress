import { CreateUserDto } from "../../modules/user/dto/createUserDto";
import { UserVo } from "../../modules/user/vo/userVo";

// export const createUserMapper = (user: any) => {
//   return new (
//     // user._id.toString(),
//     user.firstName,
//     user.lastName,
//     user.phone,
//     user.ci,
//     user.email,
//     user.firstLogin,
//     user.role,
//     user.password
//   );
// };
export class CreateUserMapper {
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly phone: string;
  public readonly ci: string;
  public readonly email: string;
  public readonly role: string;
  public readonly password: string;

  constructor(createUserDto: CreateUserDto) {
    this.firstName = createUserDto.firstName;
    this.lastName = createUserDto.lastName;
    this.phone = createUserDto.phone;
    this.ci = createUserDto.ci;
    this.email = createUserDto.email;
    this.role = createUserDto.role;
    this.password = "123456";
  }
}
