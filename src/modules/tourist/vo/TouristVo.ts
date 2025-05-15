export class TouristVo {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly nationality: string,
    public readonly documentType: string,
    public readonly ci: string,
    public readonly passportNumber: string,
    public readonly dateOfBirth: string,
    // public readonly status: string
    public readonly bookingIds: string[]
  ) {}
}
