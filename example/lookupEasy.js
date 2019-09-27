var { TaskLanguage } = require("..");

let task = new TaskLanguage();

let blackhole2 = (blackhole = () => console.log("suck"));
let mushroom2 = (mushroom = number => console.log("fungi", number));
[blackhole2, mushroom2] = task.ADDLookupCommand(blackhole2, mushroom2);

let ball2 = (ball = number => console.log("bucket", number));
let moon2 = (moon = () => console.log("rocket"));

({ ball2, moon2 } = task.ADDLookup({ ball2, moon2 }));

task.ADDCommand(blackhole2(), task.WAIT(3000), mushroom2(5), ball2(7), moon2());
task.RUN().catch(e => console.log(e));
