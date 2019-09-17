var { TaskLanguage } = require("..");

let task = new TaskLanguage();

task.ADDCommand(() => Promise.reject("POPO cross the street"));

let lookout = async () => {
  await task.RUN().catch(e => console.log(e));
  await task.RUN().catch(e => console.log(e));
};

lookout();
