var { TaskLanguage } = require("..");

let task = new TaskLanguage();
task.ADDSignalMap({ "-4": "testing failed" });

task.ADDCommand(
  task.MARK("_start0"),
  task.MARK("_start1"),
  () => {
    console.log("starting from specific index");
  },
  task.MARK("lazy inject"),
  (mem, index) => {
    console.log("current memory storage", mem, "current index", index);
  },
  mem => {
    mem.status = "working";
    console.log("assign memory.status");
  },
  mem => console.log("accessing memory.status", mem),
  task.MARK("_execute test"),
  async () =>
    await task
      ._EXECUTE(
        task.JUMP("innermarking"),
        () => console.log("hi - this one should be skipped"),
        task.MARK("innermarking"),
        () => console.log("end, this one should be called"),
        task.EXIT("-3", "fat boi")
      )
      .catch(e => console.log(e)),
  task.MARK("Previous result"),
  () => "prev - result- returned",
  () => console.log(task.previousResult)
);

task.RUN("_start1").catch(e => console.log(e));
