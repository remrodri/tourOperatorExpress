type Factory<T=any> = (container:DIContainer)=>T;

class DIContainer {
    private readonly services: Map<string, any>;
    private readonly factories: Map<string, Factory>;
    private readonly resolving: Set<string>;

    constructor() {
      this.services = new Map();
      this.factories = new Map();   
      this.resolving = new Set();
    }

    register(name:string,factory:Factory) : void {
        this.factories.set(name,factory);
    }

    get<T>(name:string):T{
      if(this.services.has(name)){
        return this.services.get(name);
      }
      if(this.resolving.has(name)){
        throw new Error(`Circular dependency detected for service ${name}`);
      }
      this.resolving.add(name);

      const factory = this.factories.get(name);
      if(!factory){
        throw new Error(`Service ${name} not found`);
      }
      // const service = factory(this);
      // this.services.set(name,service);
      // return service;
      this.resolving.add(name);

      try{
        const service = factory(this);
        this.services.set(name,service);
        return service;
      }finally{
        this.resolving.delete(name);
      }
    }

    getLazy(name:string):any{
      return new Proxy({},{
        get:(target,prop)=>{
          const service:any = this.get(name);
          return service[prop];
        }
      })
    }

    resolve<T>(name:string):T{
      return this.get(name);
    }
    has(name:string):boolean{
      return this.services.has(name);
    }

    clear():void{
      this.services.clear();
      this.factories.clear();
    }
}

export default DIContainer;
