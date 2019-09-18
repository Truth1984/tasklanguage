var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(mem => (mem.rf = 32), () => Promise.reject(5));

task.RUN().catch(e => console.log(task.memory));
