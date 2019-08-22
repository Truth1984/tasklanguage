var { TaskLanguage } = require("..");

let task = new TaskLanguage();

let askMom = [
  task.MARK("mom"),
  task.INJECT(mem => {
    console.log("where is daddy?");
    if (mem.counter == undefined) mem.counter = 0;
    return (mem.counter += 1);
  }),
  task.JUMPIF(mem => mem.counter > 4, "bye", "dad")
];

let askDad = [
  task.MARK("dad"),
  task.INJECT(mem => {
    console.log("where is mommy?");
    if (mem.counter == undefined) mem.counter = 0;
    return (mem.counter += 1);
  }),
  task.JUMPIF(mem => mem.counter > 4, "bye", "mom")
];

task.ADDSignalMap({ "-4": "Your father and mother divorced" });
task.ADDCommand(...askMom, ...askDad, task.MARK("bye"), task.EXIT("-4"));

task.RUN();
