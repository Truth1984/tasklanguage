var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  () => {
    task.index = 2;
  },
  () => console.log(1),
  () => console.log(2),
  () => console.log(3),
  () => console.log(4)
);

task.RUN();
