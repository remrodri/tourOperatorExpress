export class DateRangeVo {
  constructor(
    public readonly id: string,
    public readonly dates: string[],
    public readonly state: string,
    public readonly guides:string[]
  ) {}
}
