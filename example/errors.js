var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.addCommand(["fxNotExist", 1]);

task.run().catch(e => console.log(e));
