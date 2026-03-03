export class UserVo {
  public readonly id!: string;
  public readonly firstName!: string;
  public readonly lastName!: string;
  public readonly phone!: string;
  public readonly ci!: string;
  public readonly email!: string;
  public readonly firstLogin!: boolean;
  public readonly role!: string;
  public readonly address!: string;
  public readonly imageUrl!: string;
  public readonly deleted!: boolean;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    ci: string;
    email: string;
    firstLogin: boolean;
    role: string;
    address: string;
    imageUrl: string;
    deleted: boolean;
  }) {
    Object.assign(this, props);
  }
}
