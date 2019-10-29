var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  async mem => {
    mem.item = 10;
  },
  task.SUBTASK(task.JUMP("victor"), () => console.log("hi - this one should be skipped"), task.MARK("victor"), () =>
    console.log("end, this one should be called")
  ),

  task.JUMP("m2"),
  () => console.log("also skipped"),
  task.MARK("m2")
);
task.RUN().catch(e => console.log(e));
