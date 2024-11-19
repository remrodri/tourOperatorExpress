import { IAuthRepository } from "./IAuthRepository";

export class AuthRepository implements IAuthRepository{
  findByEmail(email: string):any {
    console.log('email::: ', email);
    // throw new Error("Method not implemented.");
  }

}