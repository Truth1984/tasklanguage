# Task Language

Mimicking assembly. Easy to visualize, modify and boost production speed.

##Intro:

- Event loop? Never heard of that.
- setTimeout? Why should I use that?
- Promises? Don't promise something you can't do.
- Here, let me introduce the task language, aka SWEATSHOP, to you.
- Simple to use, simple to implement, but most importantly, it's free.

## What's new

```
{
  "1.1.2": add SUBTASK, change error, add more examples.
  "1.0.1": capitalize method names to be easily distinguishable, and how LABOR function.
}
```

## Usage

Let's just jump into it.

```js
var { TaskLanguage } = require("tasklanguage");

let task = new TaskLanguage();

task.ADDLookup({
  bingo: (word, w2) => console.log(word + w2)
});
task.ADDCommand(
  task.MARK("h0"),
  task.INJECT((mem, index) => {
    console.log("hi1");
  }),
  task.JUMP("v3"),
  task.INJECT((mem, index) => {
    console.log("hi2");
  }),
  task.MARK("v3"),
  task.INJECT((mem, index) => {
    console.log("hi3");
  }),
  task.WAIT(mem => mem.book != undefined),
  task.INJECT((mem, index) => {
    if (!mem.page) return (mem.page = 1);
    mem.page += 1;
  }),
  task.JUMPIF((mem, index) => mem.page > 5, undefined, "v3"),
  task.LABOR("bingo", "pp ", "hard")
);

task.RUN();
setTimeout(() => task.SETMemory({ book: "interesting" }), 5000);
```

## API

### ADDCommand(...commands: any)

add commands to the command list.

### ADDLookup(pairs: { [key: string]: Function })

add user defined functions to the lookupmap

### ADDSignalMap(pairs: {})

add user defined exit code and message to the signalmap

### SETMemory(pairs: {})

publicly setting the inner memory for command list

#### MARK(name: string)

Generate Marking

#### JUMP(indexOrMark: number | string)

Jump to the mark or the index of the whole commands array

#### JUMPIF(condition: (memory: {}, index: number) => any,trueDest?: number | string,falseDest?: number | string)

condition: function, takes in current MEMORY as first param, current index as second param.

trueDest: index or mark when condition returned true

falseDest: index or mark when condition returned false

#### INJECT(callback: (memory: {}, index: number) => any)

callback: function, takes in current MEMORY as first param, current index as second param.

#### SUBTASK(...commands: any)

execute subcommands, shared memory but not MARK

#### WAIT(exitCondition: number | ((memory: {}, index: number) => any))

exitCondition : ms(\*1000 to be second) or callback, the condition check rate is every second.

#### EXIT(exitCode: string, error?: String | Promise<any>)

exitCode :

```
{ "-1" : program terminated after finish,
  "-2" : program terminated by user,
  "-3" : program exit with error }
```

error: can be self defined string.

#### LABOR(userKey: string, ...args: any)

userKey: the name of your function that you want to run (MUST BE PREDEFINED)

args: the arguments of the function.
