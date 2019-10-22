var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  async () =>
    await task
      ._EXECUTE(
        task.JUMP("innermarking"),
        () => console.log("hi - this one should be skipped"),
        task.MARK("innermarking"),
        () => console.log("end, this one should be called")
      )
      .catch(e => console.log(e)),
  task.JUMP("m2"),
  () => console.log("also skipped"),
  task.MARK("m2")
);
task.RUN().catch(e => console.log(e));
