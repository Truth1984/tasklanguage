# Task Language

Mimicking assembly. Easy to visualize, modify and boost production speed.

##Intro:

- Event loop? Never heard of that.
- setTimeout? Why should I use that?
- Promises? Don't promise something you can't do.
- Here, let me introduce the task language, aka SWEATSHOP, to you.
- Simple to use, simple to implement, but most importantly, it's free.

## Usage

Let's just jump into it.

```js
var { TaskLanguage } = require("tasklanguage");

let task = new TaskLanguage();

task.addLookup({
  bingo: (word, w2) => console.log(word + w2)
});

task.addCommand(
  task.mark("h0"),
  task.inject((mem, index) => {
    console.log("hi1");
  }),
  task.jump("v3"),
  task.inject((mem, index) => {
    console.log("hi2");
  }),
  task.mark("v3"),
  task.inject((mem, index) => {
    console.log("hi3");
  }),
  task.wait(mem => mem.book != undefined),
  task.inject((mem, index) => {
    if (!mem.page) return (mem.page = 1);
    mem.page += 1;
  }),
  task.jumpif((mem, index) => mem.page > 5, undefined, "v3"),
  task.labor("bingo", "pp ", "hard")
);

task.run();
setTimeout(() => task.setMemory({ book: "interesting" }), 5000);
```

## API

### addCommand(...commands: [])

add commands to the command list.

### addLookup(pairs: { [key: string]: Function })

add user defined functions to the lookupmap

### addSignalMap(pairs: {})

add user defined exit code and message to the signalmap

### setMemory(pairs: {})

publicly setting the inner memory for command list

#### mark(name: string)

Generate Marking

#### jump(indexOrMark: number | string)

Jump to the mark or the index of the whole commands array

#### jumpif(condition: (memory: {}, index: number) => any,trueDest?: number | string,falseDest?: number | string)

condition: function, takes in current MEMORY as first param, current index as second param.

trueDest: index or mark when condition returned true

falseDest: index or mark when condition returned false

#### inject(callback: (memory: {}, index: number) => any)

callback: function, takes in current MEMORY as first param, current index as second param.

#### wait(exitCondition: number | ((memory: {}, index: number) => any))

exitCondition : ms(\*1000 to be second) or callback, the condition check rate is every second.

#### exit(exitCode: string, error?: String | Promise<any>)

exitCode :
`{ "-1" : program terminated after finish "-2" : program terminated by user "-3" : program exit with error }`

error: can be self defined string.

#### labor(userKey: string, ...args: any)

userKey: the name of your function that you want to run (MUST BE PREDEFINED)

args: the arguments of the function.
