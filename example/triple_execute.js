var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(async () => {
  await task._EXECUTE(
    () => console.log(1),
    () =>
      task._EXECUTE(
        () => console.log(2),
        () => task._EXECUTE(() => console.log(3), task.EXIT(-2), () => console.log(7)),
        () => console.log(8)
      ),
    () => console.log(10)
  );
});

task.RUN();
