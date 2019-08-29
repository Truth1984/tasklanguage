var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(
  task.INJECT(mem => {
    mem.value = 10;
    console.log("start, set value to", mem.value);
  }),
  task.WAIT(5000),
  task.INJECT(mem => console.log("end value is", mem.value))
);

setTimeout(
  () =>
    task._CUTINLINE(
      task.INJECT(mem => {
        mem.value = 30;
        console.log("I'm scumbag, look at me, set value to", mem.value);
      })
    ),
  3000
);

task.RUN().catch(e => console.log(e));
