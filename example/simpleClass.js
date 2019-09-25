var { TaskLanguage } = require("..");

class ABC extends TaskLanguage {
  constructor() {
    super();
    this.name = "verne";
    [this.jules, this.marco, this.polo] = this.ADDLookupCommand(this.jules, this.marco, this.polo);
  }

  jules() {
    console.log(this.name);
  }

  marco() {
    this.polo();
  }

  polo() {
    console.log("lol");
  }
}

let a = new ABC();
a.ADDCommand(
  a.jules(),
  a.marco(),
  () => console.log(a._switcher),
  () => {
    a.marco();
    console.log(a._switcher);

    a._EXECUTE(() => a.marco()).catch(e => console.log("e2", e));
    a.jules();
  }
);
a.RUN().catch(e => console.log(e));
