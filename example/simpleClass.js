var { TaskLanguage } = require("..");

class ABC extends TaskLanguage {
  constructor() {
    super();
    this.name = "verne";
    let commands = [this.jules, this.marco, this.polo];
    [this.jules2, this.marco2, this.polo2] = this.ADDLookupCommand(...commands);
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
a.ADDCommand(a.jules2(), a.marco2(), async () => {
  await a._EXECUTE(a.marco2(), () => console.log(a.jules.toString())).catch(e => console.log("e2", e));
  console.log(a.jules.toString(), "--- awaited");
});
a.RUN().catch(e => console.log(e));
