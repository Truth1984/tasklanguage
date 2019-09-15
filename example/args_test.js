var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDLookup({
  plus: ultra => {
    console.log(ultra);
  }
});

task.ADDCommand(task.LABOR("plus", { bigBrother: "watching" }));

task.RUN().catch(e => console.log(e));
