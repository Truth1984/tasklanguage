var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  task.MARK("0x"),
  () => console.log(0),
  task.MARK("1x"),
  () => console.log(1),
  task.MARK("2x"),
  () => console.log(2),
  task.MARK("3x"),
  () => console.log(3)
);

task.RUNMARK("0x", "2x").catch(console.log);
