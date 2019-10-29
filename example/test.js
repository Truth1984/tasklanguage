var { TaskLanguage } = require("..");

let task = new TaskLanguage();
task.ADDSignalMap({"-4":"testing failed"})
let eq = task.ADDLookup({"eq":(a,b)=>{if(a!==b) task}})
task.ADDCommand(
  task.MARK("_start0"),
  task.MARK("_start1"),
  () => {
    console.log("starting from specific index");
  },
  task.MARK("lazy inject"),
  (mem, index) => {
    console.log("current memory storage", mem, "current index", index);
  },
  mem => {
    mem.status = "working";
    console.log("assign memory.status");
  },
  mem => console.log("accessing memory.status", mem)
);

task.RUN("_start1").catch(e => console.log(e));
