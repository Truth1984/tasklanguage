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
  "1.6.2": add quick INJECT and log function correctly
  "1.5.3": log full args, prevent [Object Object]
  "1.5.2": remove output
  "1.5.1": add _CUTINLINE
  "1.4.1": RUN can start from a specific mark
  "1.3.3": add _EXECUTE, fix JUMP error
  "1.2.2": change error catch behavior
  "1.1.2": add SUBTASK, change error message, add more examples.
  "1.0.1": capitalize method names to be easily distinguishable, and change LABOR.
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

### RUN(indexOrMark: number | string = 0)

running from beginning (index = 0) or specific mark.

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

execute subcommands, shared memory, lookupmap, signalmap, but not MARK

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

#### \_EXECUTE(...commands: any)

similar to SUBTASK, but can actually execute commands, Better use it **WITHIN** a function.

#### \_CUTINLINE(...commands: any)

will use \_EXECUTE right after current command.

#### LABOR(userKey: string, ...args: any)

userKey: the name of your function that you want to run (MUST BE PREDEFINED)

args: the arguments of the function.
