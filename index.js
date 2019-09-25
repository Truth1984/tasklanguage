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
        this._switcher = "ARRAY";
        this.userLookupArray = {};
        this.userLookupFunction = {};
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
            sub.userLookupArray = this.userLookupArray;
            sub.userLookupFunction = this.userLookupFunction;
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
            RESET(!error);
            if (error)
                return Promise.reject({ index: this.index, expression: this.commands[this.index], error: error });
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
        this.__TOGGLE("FUNCTION");
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
            if (this.userLookupFunction[key]) {
                this.previousResult = await promisify(this.userLookupFunction[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else if (this.lookup[key]) {
                this.previousResult = await promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else {
                return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
            }
            this.index += 1; // jump needs to -1
            while (this._lineCutter.length != 0) {
                let item = this._lineCutter.shift();
                if (item)
                    await this._EXECUTE(item);
            }
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
    async _EXECUTE(...commandsFunc) {
        this.__TOGGLE("ARRAY");
        let commands = [];
        for (let i of commandsFunc) {
            if (typeof i !== "function")
                return Promise.reject(`***${i}*** is not a function`);
            commands.push(i());
        }
        this.__TOGGLE("FUNCTION");
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
            if (this.userLookupFunction[key]) {
                this.previousResult = await promisify(this.userLookupFunction[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else if (this.lookup[key]) {
                this.previousResult = await promisify(this.lookup[key], ...args).catch(err => this.lookup.EXIT("-3", err));
            }
            else {
                return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
            }
        }
        this.__TOGGLE("ARRAY");
    }
    __TOGGLE(status = this._switcher) {
        if (this._switcher === status)
            return;
        if (status === "ARRAY") {
            this._switcher = "ARRAY";
            Object.assign(this, this.userLookupArray);
        }
        else if (status === "FUNCTION") {
            this._switcher = "FUNCTION";
            Object.assign(this, this.userLookupFunction);
        }
    }
    async _CUTINLINE(...commandsFunc) {
        this._lineCutter = this._lineCutter.concat(commandsFunc);
    }
    ADDCommand(...commands) {
        this.__TOGGLE("ARRAY");
        this.commands = this.commands.concat(commands);
    }
    ADDLookup(pairs) {
        Object.keys(pairs).map(i => {
            this.userLookup[i] = pairs[i].bind(this);
            this.userLookupFunction[i] = pairs[i].bind(this);
            this.userLookupArray[i] = (...param) => [i, ...param];
            pairs[i] = (...param) => [i, ...param];
        });
        return pairs;
    }
    ADDSignalMap(pairs) {
        this.userSignalMap = Object.assign(this.userSignalMap, pairs);
    }
    ADDLookupCommand(...functions) {
        return functions.map(func => {
            let name = func.name;
            this.userLookup[name] = func.bind(this);
            this.userLookupFunction[name] = func.bind(this);
            this.userLookupArray[name] = (...param) => [name, ...param];
            return (...param) => [name, ...param];
        });
    }
    SETMemory(pairs) {
        this.memory = Object.assign(this.memory, pairs);
    }
}
exports.TaskLanguage = TaskLanguage;
