var { TaskLanguage } = require("..");

let task = new TaskLanguage();

let blackhole = () => console.log("suck");
let mushroom = number => console.log("fungi", number);
[blackhole, mushroom] = task.ADDLookupCommand(blackhole, mushroom);

let ball = number => console.log("bucket", number);
let moon = () => console.log("rocket");

({ ball, moon } = task.ADDLookup({ ball, moon }));

task.ADDCommand(blackhole(), task.WAIT(3000), mushroom(5), ball(7), moon());
task.RUN().catch(e => console.log(e));
