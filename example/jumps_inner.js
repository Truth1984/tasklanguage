var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(() => {
  task._EXECUTE(
    task.JUMP("innermarking", true),
    () => console.log("hi - this one should be skipped"),
    task.MARK("innermarking"),
    () => console.log("end, this one should be called"),
    task.JUMP("m2"),
    () => {
      console.log("this should not be called, jumped outside");
    }
  );
}, task.MARK("m2"));
task.RUN().catch(e => console.log(e));
