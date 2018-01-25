title: Custom Process
---

## How to define a process

Process is defined in `procfile.js`, depending on the following syntax:

`procfile.js`

```javascript
module.exports = function (pandora) {
  pandora
    .process('processName');
}
```

`pandora.process('processName')` means that it defines a process called `processName`, this statement returns a [ProcessRepresentationChainModifier](http://www.midwayjs.org/pandora/api-reference/pandora/classes/processrepresentationchainmodifier.html) object.
We can use this object to improve the definition of the process.

The following is a simple example：

`procfile.js`

```javascript
module.exports = function (pandora) {

  // If the process definition exists, modify it, otherwise it is new
  pandora('processName')

    // rename process
    // obtained without passing parameters
    .name('renameIt')

    // Identifies the number of lateral scaling of the process, default 1, number to number or `auto`(auto to CPU number)
    // obtained without passing parameters
    .scale(5)

    // set the node.js parameters, all covered
    // use `process.execArgv` to get it in process
    // If require incremental: .nodeArgs().push('--expose-gc')
    // obtained without passing parameters
    .nodeArgs(['--expose-gc'])

    // set process parameters
    // use `process.argv` to get it in process
    // If require incremental: nodeArgs().push('--a=b')
    // obtained without passing parameters
    .args(['--a=b', '--c=d'])

    // environmental variables of the process, all covered
    // If require incremental: .env().x = 'y'
    // obtained without passing parameters
    .env({
      ENV_VAR: 'envValue'
    })

    // process start order
    // obtained without passing parameters
    .order(1)

    // the entrance file for this process
    // if not set, the process will not start (unless a service is assigned to the process)
    // obtained without passing parameters
    .entry('./app.js')

    // drop the process definition
    .drop()
}
```

### The process will not start without the program entrance

The process will not start if there is no start entrance to the process.

The start entrance, including：

1. The definition of `.entry()`
2. A service is assigned to the process

## The relationship between Scale and the process

1. If a process defines a scale that is greater than 1, start with `ScalableMater`, that is, the `master/worker` mode.
2. If a process defines a scale of 1, start it directly.

As the following image：

![img](https://img.alicdn.com/tfs/TB1gpxPhgvD8KJjy0FlXXagBFXa-1794-890.png)

