// project: https://github.com/Truth1984/tasklanguage
// author : Awada. Z
// MIT LICENSE

import * as colors from "colors/safe";

let promisify = async (func: any, ...args: any) => await func(...args);
let checkFunction = (func: any) => (typeof func == "function" ? ["INJECT", func] : func);
let logCommands = (index: Number, key: string, args: Array<any>) => {
  let argsDisplay = [];
  for (let i of args) argsDisplay.push(i && i.constructor == {}.constructor ? JSON.stringify(i) : i);
  console.log(colors.yellow(`${index}  ${key}  ${argsDisplay}`));
};
let util = { promisify, checkFunction, logCommands };

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
  private _lineCutter: Array<any[]>;

  protected signalMap: { [key: string]: string };
  protected _running: boolean;
  protected _signal: number | string;

  public _log: boolean;
  public userLookup: { [key: string]: Function };
  public userSignalMap: { [key: string]: string };
  public previousResult: any;

  public constructor(logging = true) {
    this.commands = [];
    this.index = 0;
    this.memory = {};
    this._lineCutter = [];

    this._running = false;
    this._log = logging;
    this._signal = "0";
    this.signalMap = settings.signalMap;
    this.userLookup = {};
    this.userSignalMap = {};
    this.previousResult;

    // ELIMINATE POLLUTION

    let MARK = () => {};
    let JUMP = (indexOrMark: number | string) => {
      this.index =
        typeof indexOrMark === "number"
          ? indexOrMark
          : this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
      return this.index === -1 ? Promise.reject("JUMP - Mark didn't found: " + indexOrMark) : (this.index -= 1);
    };

    let JUMPIF = async (
      condition: (memory: {}, index: number) => any,
      trueDest?: number | string,
      falseDest?: number | string
    ) => {
      if (await condition(this.memory, this.index)) {
        if (this._log) console.log(settings.jumpMsg.true);
        if (trueDest != undefined) await JUMP(trueDest);
      } else {
        if (this._log) console.log(settings.jumpMsg.false);
        if (falseDest != undefined) await JUMP(falseDest);
      }
    };

    let INJECT = async (callback: (memory: {}, index: number) => any) => {
      return callback(this.memory, this.index);
    };

    let SUBTASK = async (...commands: any) => {
      let sub = new TaskLanguage(this._log);
      sub.userSignalMap = this.userSignalMap;
      sub.userLookup = this.userLookup;
      sub.memory = this.memory;
      sub.ADDCommand(...commands);
      return sub.RUN();
    };

    let WAIT = async (exitCondition: number | ((memory: {}, index: number) => any)) => {
      if (typeof exitCondition === "number")
        return await new Promise(resolve => setTimeout(() => resolve(true), exitCondition));
      while (!(await exitCondition(this.memory, this.index))) {
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
      }
      return true;
    };

    let SKIP = async () => {};

    let EXIT = async (signal: string, error?: any) => {
      if (this._signal != "0") return;
      this._signal = signal;
      if (this._log) {
        if (this.userSignalMap[signal]) {
          console.log(this.userSignalMap[signal]);
        } else {
          console.log(this.signalMap[signal]);
        }
      }
      let errorIndex = this.index;
      RESET(!error);
      if (error) return Promise.reject({ index: errorIndex, expression: this.commands[this.index], error: error });
    };

    let RESET = (clearMemory = false) => {
      this.index = 0;
      this._lineCutter = [];
      this._running = false;
      this._signal = 0;
      if (clearMemory) this.memory = {};
    };

    let LABOR = async (userKey: string | Function, ...args: any) => {
      if (typeof userKey === "function") userKey = userKey.name;
      return this.userLookup[userKey](...args);
    };

    this.lookup = {
      MARK,
      JUMP,
      JUMPIF,
      INJECT,
      SUBTASK,
      WAIT,
      EXIT,
      SKIP,
      RESET,
      LABOR
    };
  }

  public async RUN(indexOrMark: number | string = 0) {
    this._running = true;
    this.index =
      typeof indexOrMark === "number"
        ? indexOrMark
        : this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
    if (this.index === -1) return Promise.reject("RUN - Mark didn't found: " + indexOrMark);

    while (this.index > -1 && this.index != this.commands.length && this._running) {
      let cmdArray = this.commands[this.index] || [];
      cmdArray = util.checkFunction(cmdArray);
      let key = String(cmdArray[0]);
      let args = cmdArray.slice(1);

      if (this._log) util.logCommands(this.index, key, args);

      if (this.userLookup[key]) {
        this.previousResult = await util
          .promisify(this.userLookup[key], ...args)
          .catch(err => this.lookup.EXIT("-3", err));
      } else if (this.lookup[key]) {
        this.previousResult = await util.promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
      } else {
        return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
      }
      this.index += 1; // jump needs to -1

      while (this._lineCutter.length != 0) await this._EXECUTE(this._lineCutter.shift());
    }
    return this.lookup.EXIT(this._running ? "-1" : "-2");
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
    this._lineCutter = this._lineCutter.concat(commands);
  }

  public ADDCommand(...commands: any) {
    this.commands = this.commands.concat(commands);
  }

  public ADDLookup(pairs: { [key: string]: Function }) {
    Object.keys(pairs).map(i => {
      this.userLookup[i] = pairs[i].bind(this);
      pairs[i] = (...param: any) => [i, ...param];
    });
    return pairs;
  }

  public ADDSignalMap(pairs: {}) {
    this.userSignalMap = (<any>Object).assign(this.userSignalMap, pairs);
  }

  public ADDLookupCommand(...functions: Function[]) {
    return functions.map(func => {
      this.userLookup[func.name] = func.bind(this);
      return (...param: any) => [func.name, ...param];
    });
  }

  public SETMemory(pairs: {}) {
    this.memory = (<any>Object).assign(this.memory, pairs);
  }
}
