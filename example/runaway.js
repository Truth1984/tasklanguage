var { TaskLanguage } = require("..");

let task = new TaskLanguage();

let askMom = [
  task.mark("mom"),
  task.inject(mem => {
    console.log("where is daddy?");
    if (mem.counter == undefined) mem.counter = 0;
    return (mem.counter += 1);
  }),
  task.jumpif(mem => mem.counter > 4, "bye", "dad")
];

let askDad = [
  task.mark("dad"),
  task.inject(mem => {
    console.log("where is mommy?");
    if (mem.counter == undefined) mem.counter = 0;
    return (mem.counter += 1);
  }),
  task.jumpif(mem => mem.counter > 4, "bye", "mom")
];

task.addSignalMap({ "-4": "Your father and mother divorced" });
task.addCommand(...askMom, ...askDad, task.mark("bye"), task.exit("-4"));

task.run();
