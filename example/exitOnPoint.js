var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  task.MARK("A"),
  () => console.log("doing work"),
  task.MARK("B"),
  () => console.log("you should not see this")
);

task.RUN(0, "B").catch(e => console.log(e));
