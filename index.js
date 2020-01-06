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
let timeout = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));
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
class TaskLanguage {
    constructor(logging = true) {
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
        this.lookup.MARK = () => { };
        this.lookup.JUMP = (indexOrMark) => {
            if (typeof indexOrMark === "number")
                this.index = indexOrMark;
            else
                this.index = this.commands.findIndex(value => value[0] === "MARK" && value[1] === indexOrMark);
            return this.index === -1 ? Promise.reject("JUMP - Mark didn't found: " + indexOrMark) : (this.index -= 1);
        };
        this.lookup.JUMPIF = async (condition, trueDest, falseDest) => {
            if (await condition(this.memory, this.index)) {
                if (this.entry._log)
                    console.log(settings.jumpMsg.true);
                if (trueDest != undefined)
                    await this.lookup.JUMP(trueDest);
            }
            else {
                if (this.entry._log)
                    console.log(settings.jumpMsg.false);
                if (falseDest != undefined)
                    await this.lookup.JUMP(falseDest);
            }
        };
        this.lookup.INJECT = async (callback) => {
            return callback(this.memory, this.index);
        };
        this.lookup.SUBTASK = async (...commands) => {
            let sub = new TaskLanguage(this.entry._log);
            sub.entry._mainProcess = false;
            sub.entry.userSignalMap = this.entry.userSignalMap;
            sub.entry.userLookup = this.entry.userLookup;
            sub.memory = this.memory;
            sub.ADDCommand(...commands);
            return sub.RUN();
        };
        this.lookup.WAIT = async (exitCondition) => {
            if (typeof exitCondition === "number")
                return await util.timeout(exitCondition);
            while (!(await exitCondition(this.memory, this.index)))
                await util.timeout(100);
            return true;
        };
        this.lookup.SKIP = async () => { };
        this.lookup.EXIT = async (signal, error, mainProcess = this.entry._mainProcess) => {
            if (this.entry._signal != "0")
                return;
            this.entry._signal = signal;
            if (this.entry._log && mainProcess) {
                let target = this.entry.userSignalMap[signal] ? this.entry.userSignalMap[signal] : this.entry.signalMap[signal];
                console.log(target);
            }
            let errorIndex = this.index;
            this.lookup.RESET(!error);
            if (error)
                return Promise.reject({ index: errorIndex, expression: this.commands[errorIndex], error: error });
        };
        this.lookup.RESET = (clearMemory = false) => {
            this.index = 0;
            this.entry._lineCutter = [];
            this.entry._running = false;
            this.entry._signal = 0;
            if (clearMemory)
                this.memory = {};
        };
        this.lookup.LABOR = async (userKey, ...args) => {
            if (typeof userKey === "function")
                userKey = userKey.name;
            return this.entry.userLookup[userKey](...args);
        };
    }
    async RUN(indexOrMark = 0, exits) {
        this.entry._running = true;
        this.lookup.JUMP(indexOrMark);
        this.index += 1;
        let exit = exits;
        if (exit == undefined)
            exit = this.commands.length;
        if (typeof exit == "string") {
            exit = this.commands.findIndex(value => value[0] === "MARK" && value[1] === exit);
            if (exit < 0)
                return this.lookup.EXIT("-3", `exit MARK doesn't exist: ${exits}`);
        }
        while (this.index > -1 && this.index != exit && this.entry._running) {
            let cmdArray = this.commands[this.index] || [];
            cmdArray = util.checkFunction(cmdArray);
            let key = String(cmdArray[0]);
            let args = cmdArray.slice(1);
            let toPerform = this.entry.userLookup[key] ? this.entry.userLookup[key] : this.lookup[key];
            if (this.entry._log)
                util.logCommands(this.index, key, args);
            if (toPerform)
                this.previousResult = await util.promisify(toPerform, ...args).catch(err => this.lookup.EXIT("-3", err));
            else
                return this.lookup.EXIT("-3", `function name doesn't exit: ${key}`);
            this.index += 1; // jump needs to -1
            while (this.entry._lineCutter.length != 0)
                await this._EXECUTE(this.entry._lineCutter.shift());
        }
        return this.lookup.EXIT(this.entry._running ? "-1" : "-2");
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
        this.entry._lineCutter = this.entry._lineCutter.concat(commands);
    }
    ADDCommand(...commands) {
        this.commands = this.commands.concat(commands);
    }
    ADDLookup(pairs) {
        Object.keys(pairs).map(i => {
            this.entry.userLookup[i] = pairs[i].bind(this);
            pairs[i] = (...param) => [i, ...param];
        });
        return pairs;
    }
    ADDSignalMap(pairs) {
        this.entry.userSignalMap = Object.assign(this.entry.userSignalMap, pairs);
    }
    ADDLookupCommand(...functions) {
        return functions.map(func => {
            this.entry.userLookup[func.name] = func.bind(this);
            return (...param) => [func.name, ...param];
        });
    }
    SETMemory(pairs) {
        this.memory = Object.assign(this.memory, pairs);
    }
}
exports.TaskLanguage = TaskLanguage;
