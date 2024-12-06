export class UserVo {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly ci: string,
    public readonly email: string,
    public readonly firstLogin: boolean,
    public readonly role: string
  ) {}
}
