var { TaskLanguage } = require("..");

let task = new TaskLanguage();

let blackhole = () => console.log("suck");
let mushroom = number => console.log("fungi", number);
task.ADDLookupCommand(blackhole, mushroom);

task.ADDCommand(task.LABOR(blackhole), task.WAIT(3000), task.LABOR(mushroom, 5));
task.RUN().catch(e => console.log(e));
