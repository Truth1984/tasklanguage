var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDLookup({
  bingo: (word, w2) => console.log(word + w2)
});
task.ADDCommand(
  task.MARK("h0"),
  task.INJECT((mem, index) => {
    console.log("hi1");
  }),
  task.JUMP("v3"),
  task.INJECT((mem, index) => {
    console.log("hi2");
  }),
  task.MARK("v3"),
  task.INJECT((mem, index) => {
    console.log("hi3");
  }),
  task.WAIT(mem => mem.book != undefined),
  task.INJECT((mem, index) => {
    if (!mem.page) return (mem.page = 1);
    mem.page += 1;
  }),
  task.JUMPIF((mem, index) => mem.page > 5, undefined, "v3"),
  task.LABOR("bingo", "pp ", "hard")
);

task.RUN();
setTimeout(() => task.SETMemory({ book: "interesting" }), 5000);
