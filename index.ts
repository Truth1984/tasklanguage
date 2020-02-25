// project: https://github.com/Truth1984/tasklanguage
// author : Awada. Z
// MIT LICENSE

import * as colors from "colors/safe";

let promisify = async (func: any, ...args: any) => await func(...args);
let checkFunction = (func: any) => (typeof func == "function" ? ["INJECT", func] : func);
let logCommands = (index: number, key: string, args: Array<any>) => {
  let argsDisplay = [];
  for (let i of args) argsDisplay.push(i && i.constructor == {}.constructor ? JSON.stringify(i) : i);
  console.log(colors.yellow(`${index}  ${key}  ${argsDisplay}`));
};
let timeout = (ms: number) => new Promise(resolve => setTimeout(() => resolve(), ms));
let util = { promisify, checkFunction, logCommands, timeout };

let signalMap = {
  "-1": colors.green("program terminated after finish"),
  "-2": colors.green("program terminated by user"),
  "-3": colors.red("program exit with error")
};
let jumpMsg = {
  true: colors.grey("JUMP if - true"),
  false: colors.grey("JUMP if - false")
};
let settings = { signalMap, jumpMsg };

export class TaskLanguage {
  private commands: Array<any[]>;
  private index: number;
  private memory: { [key: string]: any };
  private lookup: { [key: string]: Function };
  private entry: { [key: string]: any };
  public previousResult: any;

  public constructor(logging = true) {
    this.commands = [];
    this.index = 0;
    this.memory = {};

    this.entry = {};
    this.entry._lineCutter = [];
    this.entry._mainProcess = true;
    this.entry._running = false;
    this.entry._log = logging;
    this.entry._signal = "0";
    this.entry.signalMap = settings.signalMap;
    this.entry.userLookup = {};
    this.entry.userSignalMap = {};
    this.previousResult;

    // ELIMINATE POLLUTION

    this.lookup = {};

    this.lookup.MARK = () => {};
    this.lookup.JUMP = (indexOrMark: number | string) => {
      if (typeof indexOrMark === "number") this.index = indexOrMark;
      else this.index = this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
      return this.index === -1 ? Promise.reject("JUMP - Mark didn't found: " + indexOrMark) : (this.index -= 1);
    };

    this.lookup.JUMPIF = async (
      condition: (memory: {}, index: number) => any,
      trueDest?: number | string,
      falseDest?: number | string
    ) => {
      if (await condition(this.memory, this.index)) {
        if (this.entry._log) console.log(settings.jumpMsg.true);
        if (trueDest != undefined) await this.lookup.JUMP(trueDest);
      } else {
        if (this.entry._log) console.log(settings.jumpMsg.false);
        if (falseDest != undefined) await this.lookup.JUMP(falseDest);
      }
    };

    this.lookup.INJECT = async (callback: (memory: {}, index: number) => any) => {
      return callback(this.memory, this.index);
    };

    this.lookup.SUBTASK = async (...commands: any) => {
      let sub = new TaskLanguage(this.entry._log);
      sub.entry._mainProcess = false;
      sub.entry.userSignalMap = this.entry.userSignalMap;
      sub.entry.userLookup = this.entry.userLookup;
      sub.memory = this.memory;
      sub.ADDCommand(...commands);
      return sub.RUN();
    };

    this.lookup.WAIT = async (exitCondition: number | ((memory: {}, index: number) => any)) => {
      if (typeof exitCondition === "number") return await util.timeout(exitCondition);
      while (!(await exitCondition(this.memory, this.index))) await util.timeout(100);
      return true;
    };

    this.lookup.SKIP = async () => {};

    this.lookup.EXIT = async (signal: string, error?: any, mainProcess: boolean = this.entry._mainProcess) => {
      if (this.entry._signal != "0") return;
      this.entry._signal = signal;
      if (this.entry._log && mainProcess) {
        let target = this.entry.userSignalMap[signal] ? this.entry.userSignalMap[signal] : this.entry.signalMap[signal];
        console.log(target);
      }
      let errorIndex = this.index;
      this.lookup.RESET(!error);
      if (error) return Promise.reject({ index: errorIndex, expression: this.commands[errorIndex], error: error });
    };

    this.lookup.RESET = (clearMemory: boolean = false) => {
      this.index = 0;
      this.entry._lineCutter = [];
      this.entry._running = false;
      this.entry._signal = 0;
      if (clearMemory) this.memory = {};
    };

    this.lookup.LABOR = async (userKey: string | Function, ...args: any) => {
      if (typeof userKey === "function") userKey = userKey.name;
      return this.entry.userLookup[userKey](...args);
    };
  }

  public async RUN(indexOrMark: number | string = 0, exits?: number | string) {
    this.entry._running = true;
    this.lookup.JUMP(indexOrMark);
    this.index += 1;

    let exit = exits;
    if (exit == undefined) exit = this.commands.length;
    if (typeof exit == "string") {
      exit = this.commands.findIndex(value => value[0] === "MARK" && value[1] === exit);
      if (exit < 0) return this.lookup.EXIT("-3", `exit MARK doesn't exist: ${exits}`);
    }

    while (this.index > -1 && this.index != exit && this.entry._running) {
      let cmdArray = this.commands[this.index] || [];
      cmdArray = util.checkFunction(cmdArray);
      let key = String(cmdArray[0]);
      let args = cmdArray.slice(1);
      let toPerform = this.entry.userLookup[key] ? this.entry.userLookup[key] : this.lookup[key];

      if (this.entry._log) util.logCommands(this.index, key, args);

      if (toPerform)
        this.previousResult = await util.promisify(toPerform, ...args).catch(err => this.lookup.EXIT("-3", err));
      else return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);

      this.index += 1; // jump needs to -1

      while (this.entry._lineCutter.length != 0) await this._EXECUTE(this.entry._lineCutter.shift());
    }
    return this.lookup.EXIT(this.entry._running ? "-1" : "-2");
  }

  public async RUNMARK(...MARKS: string[]) {
    let marksArray = this.commands.filter(item => item[0] == "MARK").map(item => item[1]);
    for (let i of MARKS) {
      let endMark = marksArray[marksArray.indexOf(i) + 1];
      await this.RUN(i, endMark);
    }
  }

  public MARK(name: string) {
    return ["MARK", name];
  }

  public JUMP(indexOrMark: number | string) {
    return ["JUMP", indexOrMark];
  }

  public JUMPIF(
    condition: (memory: {}, index: number) => any,
    trueDest?: number | string,
    falseDest?: number | string
  ) {
    return ["JUMPIF", condition, trueDest, falseDest];
  }

  public INJECT(callback: (memory: {}, index: number) => any) {
    return ["INJECT", callback];
  }

  public SUBTASK(...commands: any) {
    return ["SUBTASK", ...commands];
  }

  public WAIT(exitCondition: number | ((memory: {}, index: number) => any)) {
    return ["WAIT", exitCondition];
  }

  public SKIP() {
    return ["SKIP"];
  }

  public RESET(clearMemory = false) {
    return ["RESET", clearMemory];
  }

  public EXIT(exitCode: string, error?: String | Promise<any>) {
    return ["EXIT", exitCode, error];
  }

  public LABOR(userKey: string, ...args: any) {
    return ["LABOR", userKey, ...args];
  }

  public async _EXECUTE(...commands: any) {
    return this.lookup["SUBTASK"](...commands);
  }

  public async _CUTINLINE(...commands: any) {
    this.entry._lineCutter = this.entry._lineCutter.concat(commands);
  }

  public ADDCommand(...commands: any) {
    this.commands = this.commands.concat(commands);
  }

  public ADDLookup(pairs: { [key: string]: Function }) {
    Object.keys(pairs).map(i => {
      this.entry.userLookup[i] = pairs[i].bind(this);
      pairs[i] = (...param: any) => [i, ...param];
    });
    return pairs;
  }

  public ADDSignalMap(pairs: {}) {
    this.entry.userSignalMap = (<any>Object).assign(this.entry.userSignalMap, pairs);
  }

  public ADDLookupCommand(...functions: Function[]) {
    return functions.map(func => {
      this.entry.userLookup[func.name] = func.bind(this);
      return (...param: any) => [func.name, ...param];
    });
  }

  public SETMemory(pairs: {}) {
    this.memory = (<any>Object).assign(this.memory, pairs);
  }
}
