"use strict";
// project: https://github.com/Truth1984/tasklanguage
// author : Awada. Z
// MIT LICENSE
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors/safe");
class TaskLanguage {
    constructor(logging = true) {
        this.commands = [];
        this.index = 0;
        this.memory = {};
        this._lineCutter = [];
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
                    console.log(colors.grey("JUMP if - true"));
                if (trueDest != undefined)
                    await JUMP(trueDest);
            }
            else {
                if (this._log)
                    console.log(colors.grey("JUMP if - false"));
                if (falseDest != undefined)
                    await JUMP(falseDest);
            }
        };
        let INJECT = async (callback) => {
            return callback(this.memory, this.index);
        };
        let SUBTASK = async (...commands) => {
            let sub = new TaskLanguage(this._log);
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
        let EXIT = async (signal, error) => {
            if (this._signal != "0")
                return;
            this._signal = signal;
            if (this._log) {
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
                return Promise.reject({ index: errorIndex, expression: this.commands[this.index], error: error });
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
        let promisify = async (func, ...args) => func(...args);
        while (this.index > -1 && this.index != this.commands.length && this._running) {
            let cmdArray = this.commands[this.index] || [];
            if (cmdArray instanceof Function)
                cmdArray = ["INJECT", cmdArray];
            let key = String(cmdArray[0]);
            let args = cmdArray.slice(1);
            if (this._log) {
                let argsDisplay = [];
                for (let i of args)
                    argsDisplay.push(i && i.constructor == {}.constructor ? JSON.stringify(i) : i);
                console.log(colors.yellow(`${this.index}  ${key}  ${argsDisplay}`));
            }
            if (this.userLookup[key]) {
                this.previousResult = await promisify(this.userLookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else if (this.lookup[key]) {
                this.previousResult = await promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
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
        let promisify = async (func, ...args) => func(...args);
        for (let i of commands) {
            if (i instanceof Function)
                i = ["INJECT", i];
            i = i || [];
            let key = String(i[0]);
            let args = i.slice(1);
            if (this._log) {
                let argsDisplay = [];
                for (let j of args)
                    argsDisplay.push(j && j.constructor == {}.constructor ? JSON.stringify(j) : j);
                console.log(colors.yellow(`${this.index}  ${key}  ${argsDisplay}`));
            }
            if (this.userLookup[key]) {
                this.previousResult = await promisify(this.userLookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else if (this.lookup[key]) {
                this.previousResult = await promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else {
                return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
            }
        }
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
