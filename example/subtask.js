var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDLookup({
  bingo: (word, w2) => console.log(word + w2)
});

task.ADDCommand(
  task.INJECT(() => console.log("subtask test")),
  task.SUBTASK(
    task.INJECT(() => console.log("inside subtask")),
    task.JUMP("submark"),
    task.INJECT(() => console.log("skipp")),
    task.MARK("submark"),
    task.LABOR("bingo", "hello", "boi"),
    task.INJECT(mem => (mem.fox = "red"))
  ),
  task.INJECT(mem => console.log("mem", mem)),
  task.MARK("outside"),
  task.SUBTASK(task.JUMP("outside"))
);

task.RUN().catch(e => console.log(e));
