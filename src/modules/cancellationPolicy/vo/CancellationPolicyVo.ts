export class CancellationPolicyVo {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly deadLine: number,
    public readonly refoundPercentage: number,
    public readonly description: string
  ) {}
}
