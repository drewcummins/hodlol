# Log all the things

To use the logger new it like this:

```javascript
import { LoggerApi } from "./utils/logger";
const logger = new LoggerApi();
```

It just wraps https://github.com/visionmedia/debug in some convenience.
The readme there is also worth a read.

When you call it in this manner, it will create a logger that is
prefixed for logs with the file in question. For example, if you
use the logger from `/src/models/backfiller.ts` you will get logs like:

```
    src/models/backfiller my log message  +0ms
```

This allows you to run your process with:

```
> DEBUG=* node index.ts [flags]
```

Where DEBUG is the env variable that the logger looks at to know whether
or not it should display a log message to standard out. In this case `*`
is a wild card stating "show all the things". We could see all output from models by
doing:


```
> DEBUG=/src/models/* node index.ts [flags]
```

Then we would only see logs with that prefix.


You can also "hard code" a name by supplying one:

```javascript
import { LoggerApi } from "./utils/logger";
const logger = new LoggerApi("lala");
```

This would create a logger prefixed with `lala` at each line.

## Info vs Error

The logger also alows you to use `logger.info` for basic tracking and `logger.error`
(think `console.log` vs `console.error`). `Info` will print messages as described above,
`error` will tag messages as being an error. For example `logger.info("my message")`
in the example above would print:

```
    src/models/backfiller my message  +0ms
```


Whereas `logger.error` will print:



```
    src/models/backfiller:ERROR my message  +0ms
```

As such you can filter for just errors using:

```
> DEBUG=*ERROR node index.ts [flags]
```

Or just errors in model files using:

```
> DEBUG=/src/models/*ERROR node index.ts [flags]
```

## Fatals

`logger.fatal` will log an error, but then throw. This is nice because you can pass multiple params to the logger line `console.log` be sure they are logged and then use the first msg param as the error string:

```javascript
 logger.fatal("We couldn't find trader: opts.trader, " supplied opts:", opts);
 ```

 The above line of code would log all of the supplied info, just line `console.log` but then throw "We couldn't find trader: /src/foo.trader".

