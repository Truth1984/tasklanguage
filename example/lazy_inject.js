var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(task.INJECT(mem => (mem.IT = 2017)), (mem, index) => console.log("index", index, "IT", mem.IT));
task.RUN().catch(e => console.log(e));
