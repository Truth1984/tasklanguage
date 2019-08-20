var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.addLookup({
  bingo: (word, w2) => console.log(word + w2)
});
task.addCommand(
  task.mark("h0"),
  task.inject((mem, index) => {
    console.log("hi1");
  }),
  task.jump("v3"),
  task.inject((mem, index) => {
    console.log("hi2");
  }),
  task.mark("v3"),
  task.inject((mem, index) => {
    console.log("hi3");
  }),
  task.wait(mem => mem.book != undefined),
  task.inject((mem, index) => {
    if (!mem.page) return (mem.page = 1);
    mem.page += 1;
  }),
  task.jumpif((mem, index) => mem.page > 5, undefined, "v3"),
  task.labor("bingo", "pp ", "hard")
);

task.run();
setTimeout(() => task.setMemory({ book: "interesting" }), 5000);
