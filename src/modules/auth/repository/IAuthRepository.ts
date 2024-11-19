export interface IAuthRepository {
  findByEmail(email: string): Promise<any>;
}
