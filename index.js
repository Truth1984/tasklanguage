"use strict";
// project: https://github.com/Truth1984/tasklanguage
// author : Awada. Z
// MIT LICENSE
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors/safe");
let promisify = async (func, ...args) => await func(...args);
let checkFunction = (func) => (typeof func == "function" ? ["INJECT", func] : func);
let logCommands = (index, key, args) => {
    let argsDisplay = [];
    for (let i of args)
        argsDisplay.push(i && i.constructor == {}.constructor ? JSON.stringify(i) : i);
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
class TaskLanguage {
    constructor(logging = true) {
        this.commands = [];
        this.index = 0;
        this.memory = {};
        this._lineCutter = [];
        this._mainProcess = true;
        this._running = false;
        this._log = logging;
        this._signal = "0";
        this.signalMap = settings.signalMap;
        this.userLookup = {};
        this.userSignalMap = {};
        this.previousResult;
        // ELIMINATE POLLUTION
        let MARK = () => { };
        let JUMP = (indexOrMark) => {
            this.index =
                typeof indexOrMark === "number"
                    ? indexOrMark
                    : this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
            return this.index === -1 ? Promise.reject("JUMP - Mark didn't found: " + indexOrMark) : (this.index -= 1);
        };
        let JUMPIF = async (condition, trueDest, falseDest) => {
            if (await condition(this.memory, this.index)) {
                if (this._log)
                    console.log(settings.jumpMsg.true);
                if (trueDest != undefined)
                    await JUMP(trueDest);
            }
            else {
                if (this._log)
                    console.log(settings.jumpMsg.false);
                if (falseDest != undefined)
                    await JUMP(falseDest);
            }
        };
        let INJECT = async (callback) => {
            return callback(this.memory, this.index);
        };
        let SUBTASK = async (...commands) => {
            let sub = new TaskLanguage(this._log);
            sub._mainProcess = false;
            sub.userSignalMap = this.userSignalMap;
            sub.userLookup = this.userLookup;
            sub.memory = this.memory;
            sub.ADDCommand(...commands);
            return sub.RUN();
        };
        let WAIT = async (exitCondition) => {
            if (typeof exitCondition === "number")
                return await new Promise(resolve => setTimeout(() => resolve(true), exitCondition));
            while (!(await exitCondition(this.memory, this.index))) {
                await new Promise(resolve => setTimeout(() => resolve(true), 1000));
            }
            return true;
        };
        let SKIP = async () => { };
        let EXIT = async (signal, error, mainProcess = this._mainProcess) => {
            if (this._signal != "0")
                return;
            this._signal = signal;
            if (this._log && mainProcess) {
                if (this.userSignalMap[signal]) {
                    console.log(this.userSignalMap[signal]);
                }
                else {
                    console.log(this.signalMap[signal]);
                }
            }
            let errorIndex = this.index;
            RESET(!error);
            if (error)
                return Promise.reject({ index: errorIndex, expression: this.commands[errorIndex], error: error });
        };
        let RESET = (clearMemory = false) => {
            this.index = 0;
            this._lineCutter = [];
            this._running = false;
            this._signal = 0;
            if (clearMemory)
                this.memory = {};
        };
        let LABOR = async (userKey, ...args) => {
            if (typeof userKey === "function")
                userKey = userKey.name;
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
    async RUN(indexOrMark = 0) {
        this._running = true;
        this.index =
            typeof indexOrMark === "number"
                ? indexOrMark
                : this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
        if (this.index === -1)
            return Promise.reject("RUN - Mark didn't found: " + indexOrMark);
        while (this.index > -1 && this.index != this.commands.length && this._running) {
            let cmdArray = this.commands[this.index] || [];
            cmdArray = util.checkFunction(cmdArray);
            let key = String(cmdArray[0]);
            let args = cmdArray.slice(1);
            if (this._log)
                util.logCommands(this.index, key, args);
            if (this.userLookup[key]) {
                this.previousResult = await util
                    .promisify(this.userLookup[key], ...args)
                    .catch(err => this.lookup.EXIT("-3", err));
            }
            else if (this.lookup[key]) {
                this.previousResult = await util.promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else {
                return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
            }
            this.index += 1; // jump needs to -1
            while (this._lineCutter.length != 0)
                await this._EXECUTE(this._lineCutter.shift());
        }
        return this.lookup.EXIT(this._running ? "-1" : "-2");
    }
    MARK(name) {
        return ["MARK", name];
    }
    JUMP(indexOrMark) {
        return ["JUMP", indexOrMark];
    }
    JUMPIF(condition, trueDest, falseDest) {
        return ["JUMPIF", condition, trueDest, falseDest];
    }
    INJECT(callback) {
        return ["INJECT", callback];
    }
    SUBTASK(...commands) {
        return ["SUBTASK", ...commands];
    }
    WAIT(exitCondition) {
        return ["WAIT", exitCondition];
    }
    SKIP() {
        return ["SKIP"];
    }
    RESET(clearMemory = false) {
        return ["RESET", clearMemory];
    }
    EXIT(exitCode, error) {
        return ["EXIT", exitCode, error];
    }
    LABOR(userKey, ...args) {
        return ["LABOR", userKey, ...args];
    }
    async _EXECUTE(...commands) {
        return this.lookup["SUBTASK"](...commands);
    }
    async _CUTINLINE(...commands) {
        this._lineCutter = this._lineCutter.concat(commands);
    }
    ADDCommand(...commands) {
        this.commands = this.commands.concat(commands);
    }
    ADDLookup(pairs) {
        Object.keys(pairs).map(i => {
            this.userLookup[i] = pairs[i].bind(this);
            pairs[i] = (...param) => [i, ...param];
        });
        return pairs;
    }
    ADDSignalMap(pairs) {
        this.userSignalMap = Object.assign(this.userSignalMap, pairs);
    }
    ADDLookupCommand(...functions) {
        return functions.map(func => {
            this.userLookup[func.name] = func.bind(this);
            return (...param) => [func.name, ...param];
        });
    }
    SETMemory(pairs) {
        this.memory = Object.assign(this.memory, pairs);
    }
}
exports.TaskLanguage = TaskLanguage;
