"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors/safe");
class TaskLanguage {
    constructor(logging = true) {
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
    _initialize() {
        //partially true private
        let _jump = (indexOrMark) => {
            if (typeof indexOrMark === "number")
                return (this.index = indexOrMark - 1);
            for (let i = 0; i < this.commands.length; i++) {
                if (JSON.stringify(this.commands[i]) === JSON.stringify(["mark", indexOrMark]))
                    return (this.index = i - 1);
            }
            return _exit("-3", "JUMP - Mark didn't found: " + indexOrMark);
        };
        let _jumpif = (condition, trueDest, falseDest) => __awaiter(this, void 0, void 0, function* () {
            if (yield condition(this.memory, this.index)) {
                if (this._log)
                    console.log(colors.grey("jump if - true"));
                if (trueDest != undefined)
                    yield _jump(trueDest);
            }
            else {
                if (this._log)
                    console.log(colors.grey("jump if - false"));
                if (falseDest != undefined)
                    yield _jump(falseDest);
            }
        });
        let _inject = (callback) => __awaiter(this, void 0, void 0, function* () {
            return callback(this.memory, this.index);
        });
        let _wait = (exitCondition) => __awaiter(this, void 0, void 0, function* () {
            if (typeof exitCondition === "number")
                return yield new Promise(resolve => setTimeout(() => resolve(true), exitCondition));
            while (!(yield exitCondition(this.memory, this.index))) {
                yield new Promise(resolve => setTimeout(() => resolve(true), 1000));
            }
            return true;
        });
        let _exit = (signal, error) => __awaiter(this, void 0, void 0, function* () {
            if (this._signal != "0")
                return;
            this._signal = signal;
            this._running = false;
            if (this._log) {
                if (this.userSignalMap[signal]) {
                    console.log(this.userSignalMap[signal]);
                }
                else {
                    console.log(this.signalMap[signal]);
                }
            }
            if (error)
                return Promise.reject(error);
        });
        this.lookup.mark = () => { };
        this.lookup.jump = _jump;
        this.lookup.jumpif = _jumpif;
        this.lookup.inject = _inject;
        this.lookup.wait = _wait;
        this.lookup.exit = _exit;
    }
    run(index = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            this._running = true;
            this.index = index;
            while (this.index > -1 && this.index != this.commands.length && this._running) {
                let cmdArray = this.commands[this.index];
                let key = String(cmdArray[0]);
                let args = cmdArray.slice(1);
                if (this._log)
                    console.log(colors.yellow(`${this.index}  ${key}  ${args}`));
                if (key === "labor") {
                    console.log(args, typeof args);
                    yield Promise.resolve(yield this.userLookup[String(args[0])](...args.slice(1))).catch(err => this.lookup.exit("-3", err));
                }
                else {
                    yield Promise.resolve(yield this.lookup[key](...args)).catch(err => this.lookup.exit("-3", err));
                }
                this.index += 1; // jump needs to -1
            }
            return this.lookup.exit(this._running ? "-1" : "-2");
        });
    }
    mark(name) {
        return ["mark", name];
    }
    jump(indexOrMark) {
        return ["jump", indexOrMark];
    }
    jumpif(condition, trueDest, falseDest) {
        return ["jumpif", condition, trueDest, falseDest];
    }
    inject(callback) {
        return ["inject", callback];
    }
    wait(exitCondition) {
        return ["wait", exitCondition];
    }
    exit(exitCode, error) {
        return ["exit", exitCode, error];
    }
    labor(userKey, ...args) {
        return ["labor", userKey, ...args];
    }
    addCommand(...commands) {
        this.commands = this.commands.concat(commands);
    }
    addLookup(pairs) {
        this.userLookup = Object.assign(this.userLookup, pairs);
    }
    addSignalMap(pairs) {
        this.userSignalMap = Object.assign(this.userSignalMap, pairs);
    }
    setMemory(pairs) {
        this.memory = Object.assign(this.memory, pairs);
    }
}
exports.TaskLanguage = TaskLanguage;
