var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  task.INJECT(() => console.log(0)),
  task.MARK("pp"),
  task.INJECT(() => console.log(32)),
  task.JUMP(5),
  task.INJECT(() => console.log(36)),
  task.INJECT(() => console.log(43)),
  task.INJECT(() => console.log(98))
);
task.RUN("pp").catch(e => console.log(e));
