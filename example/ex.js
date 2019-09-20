var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  () => "didn't workout",
  () => console.log(task.previousResult),
  () => {},
  () => console.log(task.previousResult),
  () => "subtask",
  task.SUBTASK(() => console.log(task.previousResult)),
  () => console.log(task.previousResult),
  () => "execute",
  () => task._EXECUTE(() => console.log(task.previousResult))
);

task.RUN();
