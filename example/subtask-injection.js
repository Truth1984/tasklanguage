var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  task.INJECT(async mem => {
    mem.rd = 3;
  }),
  task.INJECT(mem => console.log(mem.rd)),
  task.SUBTASK(task.INJECT(() => console.log(true))),
  task.INJECT(async mem => {
    task.lookup["SUBTASK"](task.INJECT(mems => console.log(mems.rd, "meme")));
  })
);
task.RUN();
