// project: https://github.com/Truth1984/tasklanguage
// author : Awada. Z
// MIT LICENSE

import * as colors from "colors/safe";

export class TaskLanguage {
  private commands: Array<any[]>;
  private index: number;
  private memory: { [key: string]: any };
  private lookup: { [key: string]: Function };

  protected signalMap: { [key: string]: string };
  protected _running: boolean;
  protected _log: boolean;
  protected _signal: number | string;

  public userLookup: { [key: string]: Function };
  public userSignalMap: { [key: string]: string };

  public constructor(logging = true) {
    this.commands = [];
    this.index = 0;
    this.memory = {};

    this._running = false;
    this._log = logging;
    this._signal = "0";
    this.signalMap = {
      "-1": colors.green("program terminated after finish"),
      "-2": colors.green("program terminated by user"),
      "-3": colors.red("program exit with error")
    };
    this.userLookup = {};
    this.userSignalMap = {};

    // ELIMINATE POLLUTION

    let MARK = () => {};
    let JUMP = (indexOrMark: number | string) => {
      if (typeof indexOrMark === "number") return (this.index = indexOrMark - 1);
      for (let i = 0; i < this.commands.length; i++) {
        if (JSON.stringify(this.commands[i]) === JSON.stringify(["MARK", indexOrMark])) return (this.index = i - 1);
      }
      return EXIT("-3", colors.red("JUMP - Mark didn't found: " + indexOrMark));
    };

    let JUMPIF = async (
      condition: (memory: {}, index: number) => any,
      trueDest?: number | string,
      falseDest?: number | string
    ) => {
      if (await condition(this.memory, this.index)) {
        if (this._log) console.log(colors.grey("JUMP if - true"));
        if (trueDest != undefined) await JUMP(trueDest);
      } else {
        if (this._log) console.log(colors.grey("JUMP if - false"));
        if (falseDest != undefined) await JUMP(falseDest);
      }
    };

    let INJECT = async (callback: (memory: {}, index: number) => any) => {
      return callback(this.memory, this.index);
    };

    let WAIT = async (exitCondition: number | ((memory: {}, index: number) => any)) => {
      if (typeof exitCondition === "number")
        return await new Promise(resolve => setTimeout(() => resolve(true), exitCondition));
      while (!(await exitCondition(this.memory, this.index))) {
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
      }
      return true;
    };

    let EXIT = async (signal: string, error?: any) => {
      if (this._signal != "0") return;
      this._signal = signal;
      this._running = false;
      if (this._log) {
        if (this.userSignalMap[signal]) {
          console.log(this.userSignalMap[signal]);
        } else {
          console.log(this.signalMap[signal]);
        }
      }
      if (error) return Promise.reject({ index: this.index, expression: this.commands[this.index], error: error });
    };

    let LABOR = async (userKey: string, ...args: any) => {
      return this.userLookup[userKey](...args);
    };

    this.lookup = {
      MARK,
      JUMP,
      JUMPIF,
      INJECT,
      WAIT,
      EXIT,
      LABOR
    };
  }

  public async RUN(index = 0) {
    this._running = true;
    this.index = index;
    while (this.index > -1 && this.index != this.commands.length && this._running) {
      let cmdArray = this.commands[this.index];
      let key = String(cmdArray[0]);
      let args = cmdArray.slice(1);
      if (this._log) console.log(colors.yellow(`${this.index}  ${key}  ${args}`));

      if (this.userLookup[key]) {
        await Promise.resolve(await this.userLookup[key](...args)).catch(err => this.lookup.EXIT("-3", err));
      } else if (this.lookup[key]) {
        await Promise.resolve(await this.lookup[key](...args)).catch(err => this.lookup.EXIT("-3", err));
      } else {
        return this.lookup.EXIT(-3, `function name doesn't exit: ${key}`);
      }
      this.index += 1; // jump needs to -1
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

  public WAIT(exitCondition: number | ((memory: {}, index: number) => any)) {
    return ["WAIT", exitCondition];
  }

  public EXIT(exitCode: string, error?: String | Promise<any>) {
    return ["EXIT", exitCode, error];
  }

  public LABOR(userKey: string, ...args: any) {
    return ["LABOR", userKey, ...args];
  }

  public ADDCommand(...commands: []) {
    this.commands = this.commands.concat(commands);
  }

  public ADDLookup(pairs: { [key: string]: Function }) {
    this.userLookup = (<any>Object).assign(this.userLookup, pairs);
  }

  public ADDSignalMap(pairs: {}) {
    this.userSignalMap = (<any>Object).assign(this.userSignalMap, pairs);
  }

  public SETMemory(pairs: {}) {
    this.memory = (<any>Object).assign(this.memory, pairs);
  }
}
