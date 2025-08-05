export class BookingUpdatedAttendanceVo {
  constructor(
public readonly bookingId: string,
public readonly attendance: {touristId: string, status: string}[],
  ) {}
}