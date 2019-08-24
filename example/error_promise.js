var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(task.INJECT(mem => Promise.reject("lack of Pseudo")));

task.RUN().catch(e => console.log(e));
