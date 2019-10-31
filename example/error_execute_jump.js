var { TaskLanguage } = require("..");

let task = new TaskLanguage();
let task2 = new TaskLanguage();

let t = async () => {
  task.ADDCommand(
    task.JUMP("MOM"),
    task.INJECT(mem => {
      task._EXECUTE(task.MARK("MOM"));
    })
  );

  await task.RUN().catch(e => console.log(e));

  task2.ADDCommand(
    task2.MARK("creepy-old-man"),
    task2.JUMPIF(mem => mem.him != undefined, "end"),
    task2.INJECT(mem => {
      mem.him = 50;
      task2._EXECUTE(task2.JUMP("creepy-old-man"));
    }),
    task2.MARK("end"),
    task2.INJECT(() => console.log("escaped?"))
  );

  await task2.RUN();
};

t();
