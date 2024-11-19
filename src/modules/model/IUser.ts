export interface IUser extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  ci: string;
  email: string;
  password: string;
  deleted: boolean;
  firstLogin: boolean;
  role: string;
}
