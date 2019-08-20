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
    this.lookup = {};

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
    this._initialize();
  }

  private _initialize() {
    //partially true private
    let _jump = (indexOrMark: number | string) => {
      if (typeof indexOrMark === "number") return (this.index = indexOrMark - 1);
      for (let i = 0; i < this.commands.length; i++) {
        if (JSON.stringify(this.commands[i]) === JSON.stringify(["mark", indexOrMark])) return (this.index = i - 1);
      }
      return _exit("-3", "JUMP - Mark didn't found: " + indexOrMark);
    };

    let _jumpif = async (
      condition: (memory: {}, index: number) => any,
      trueDest?: number | string,
      falseDest?: number | string
    ) => {
      if (await condition(this.memory, this.index)) {
        if (this._log) console.log(colors.grey("jump if - true"));
        if (trueDest != undefined) await _jump(trueDest);
      } else {
        if (this._log) console.log(colors.grey("jump if - false"));
        if (falseDest != undefined) await _jump(falseDest);
      }
    };

    let _inject = async (callback: (memory: {}, index: number) => any) => {
      return callback(this.memory, this.index);
    };

    let _wait = async (exitCondition: number | ((memory: {}, index: number) => any)) => {
      if (typeof exitCondition === "number")
        return await new Promise(resolve => setTimeout(() => resolve(true), exitCondition));
      while (!(await exitCondition(this.memory, this.index))) {
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
      }
      return true;
    };

    let _exit = async (signal: string, error?: any) => {
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
      if (error) return Promise.reject(error);
    };

    this.lookup.mark = () => {};
    this.lookup.jump = _jump;
    this.lookup.jumpif = _jumpif;
    this.lookup.inject = _inject;
    this.lookup.wait = _wait;
    this.lookup.exit = _exit;
  }

  async run(index = 0) {
    this._running = true;
    this.index = index;
    while (this.index > -1 && this.index != this.commands.length && this._running) {
      let cmdArray = this.commands[this.index];
      let key = String(cmdArray[0]);
      let args = cmdArray.slice(1);
      if (this._log) console.log(colors.yellow(`${this.index}  ${key}  ${args}`));

      if (key === "labor" || !this.lookup[key]) {
        await Promise.resolve(await this.userLookup[String(args[0])](...args.slice(1))).catch(err =>
          this.lookup.exit("-3", err)
        );
      } else {
        await Promise.resolve(await this.lookup[key](...args)).catch(err => this.lookup.exit("-3", err));
      }
      this.index += 1; // jump needs to -1
    }
    return this.lookup.exit(this._running ? "-1" : "-2");
  }

  public mark(name: string) {
    return ["mark", name];
  }

  public jump(indexOrMark: number | string) {
    return ["jump", indexOrMark];
  }

  public jumpif(
    condition: (memory: {}, index: number) => any,
    trueDest?: number | string,
    falseDest?: number | string
  ) {
    return ["jumpif", condition, trueDest, falseDest];
  }

  public inject(callback: (memory: {}, index: number) => any) {
    return ["inject", callback];
  }

  public wait(exitCondition: number | ((memory: {}, index: number) => any)) {
    return ["wait", exitCondition];
  }

  public exit(exitCode: string, error?: String | Promise<any>) {
    return ["exit", exitCode, error];
  }

  public labor(userKey: string, ...args: any) {
    return ["labor", userKey, ...args];
  }

  public addCommand(...commands: []) {
    this.commands = this.commands.concat(commands);
  }

  public addLookup(pairs: { [key: string]: Function }) {
    this.userLookup = (<any>Object).assign(this.userLookup, pairs);
  }

  public addSignalMap(pairs: {}) {
    this.userSignalMap = (<any>Object).assign(this.userSignalMap, pairs);
  }

  public setMemory(pairs: {}) {
    this.memory = (<any>Object).assign(this.memory, pairs);
  }
}
