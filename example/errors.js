var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(["fxNotExist", 1]);

task.RUN().catch(e => console.log(e));
