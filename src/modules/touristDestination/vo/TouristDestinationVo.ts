export class TouristDestinationVo{
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description:string,
    public readonly imageFolder: string,
    public readonly images: string[],
    public readonly deleted:boolean,
  ){}
}