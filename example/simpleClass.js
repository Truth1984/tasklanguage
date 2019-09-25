var { TaskLanguage } = require("..");

class ABC extends TaskLanguage {
  constructor() {
    super();
    this.name = "verne";
    [this.jules] = this.ADDLookupCommand(this.jules);
  }

  jules() {
    console.log(this.name);
  }
}

let a = new ABC();
a.ADDCommand(a.jules());
a.RUN().catch(e => console.log(e));
