var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDSignalMap({ popo: "Wanna taste some big sticks?" });
task.ADDCommand(
  task.INJECT(mem => {
    Promise.reject("found contraband under your bed").catch(e => task._EXECUTE(task.EXIT("popo")));
  }),
  task.INJECT(mem => console.log("still going?"))
);

task.RUN();
