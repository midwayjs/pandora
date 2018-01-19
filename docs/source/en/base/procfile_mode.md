title: Understand procfile.js
---

The procfile.js is a normal JS file, that provides chain style syntax to describe the process structure of application. which can be based on procfile.js to describe the process layout, and use a lot of powerful functions provided by Pandora.js.

Of course, it's not just simply to create some processes. It doing much better:

> The Pandora.js will protect all created processes.
> 
> The simple functions as auto restart, rotate log files, and count number of reset times.
> 
> The advanced functions as collect metrics over 30 indicators, auto business logic link tracing, integrate to existing APM ( such as Open-falcon ) and so on.
> 


## Where should I put procfile. js ?

The Pandora.js looks for 'procfile.js' within the following locations: 

* ${appDir}/procfile.js

<!--* ${appDir}/node_modules/.bin/procfile.js (For default behavior to be injected into the framework, the interface is reserved for the future, and there is no used) -->


## Start a simple Node.js program


The type of the 'pandora' object as below is [ProcfileReconcilerAccessor](http://www.midwayjs.org/pandora/api-reference/pandora/classes/procfilereconcileraccessor.html), you can click to view the detailed API.


Let's look at an example:

`procfile.js`

```javascript
// The procfile.js is a normal Node.js module, that must export a function

// The first parameter for function(pandora) is ProcfileReconcilerAccessor, which is used to define our process structure.
module.exports = function(pandora) {

  pandora
  
    // Define a process named processA
    .process('processA')
	
    // If scale is greater than 1, a process group will be automatically produced using the cluster module of Node.js
    // The default value is 1
    .scale(1)
	
    // Define process environment variables, which can be got by process.env in the process just created.
    .env({
      ENV_VAR1: 'VALUE_OF_ENV_VAR1'
    })
	
	// The entry file of this process
	.entry('./app.js');
    
}
```

`app.js`

```javascript
console.log(`Got the value of ENV_VAR1: ${process.env. ENV_VAR1} from Process [pid = ${process.pid}]`);
```

Then we run the command：

```bash
$ pandora dev # Start an application at front via pandora dev, mostly for local debugging
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19766]
2017-12-11 13:59:12,578 INFO 19530 Process [name = processA, pid = 19766] Started successfully!
** Application start successful. **
```

## Auto-scaling process based on scale

Try to change `.scale(1)` of the above example to `.scale(4)`, and start it at front:

```bash
$ pandora dev # Start an application at front via pandora dev, mostly for local debugging
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19913]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19915]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19916]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19914]
2017-12-11 14:04:57,836 INFO 19910 Process [name = processA, pid = 19912] Started successfully!
** Application start successful. **
```

We can see that the process has scaled to 4, each is the 19913, 19915, 19916, 19914. We can also see 19912, which is the master of those 4 processes.

The following image may be easier to understand:

![img](https://img.alicdn.com/tfs/TB1zC45hr_I8KJjy1XaXXbsxpXa-1768-916.png)

## Two convenient alias: fork and cluster

To facilitate user use, we offer two easy-to-use alias, cluster and fork.

On the one hand is for easy to use, but also for compatible with the stock of Node.js applications, let those stock applications can also be used very easily.

**Fork**


The pandora.fork() is an alias of process.process().


`procfile.js`

```javascript
module.exports = function(pandora) {

  // Start ./app.js directly, equivalent to use child_process.spawn to start process.
  pandora.fork('aForkedProcess', './app.js');

}
```

The above example is equivalent to below:

`procfile.js`

```javascript
module.exports = function(pandora) {

  pandora
  
    // Define a process named aForkedApp
    .process('aForkedApp')
	
    // Specify only scale to 1
    .scale(1)
	
    // Specify entry file of this process
    .entry('./app.js');

}
```

**Cluster**

The pandora.cluster() is an alias of process.service().

`procfile.js`

```javascript
module.exports = function(pandora) {

  // Start app. js with the cluster module
  // By default, allocate to 'worker' process.
  // Pandora. js has a built-in process definition of "process('worker').scale('auto')" ('auto' means number of CPUs).
  pandora.cluster('./app.js');

}
```

The above example is equivalent to below:

`procfile.js`

```javascript
module.exports = function(pandora) {
  
  // Define a process named 'worker', which is actually already a built-in definition of the Pandora.js.
  pandora
    .process('worker')
    .scale('auto');
  
  // Define a service, and allocate it into 'worker' process.
  // Do only one thing, require('./app.js').
  pandora
    .service('scalableService', class ScalableService {
      start() {
        require('./app.js');
      }
    })
    .process('worker');

}
```


## The mechanism of service


In the previous, we talked about that pandora.cluster() is a alias for process.service. So what exactly is the Service ?

Service also defines the Node.js program in the process, but more structured.

provides the following basis capabilities: 

1. The standard `async start()` interface, so that users can asynchronous start the Node.js program.
2. The standard `async stop()` interface, so users can graceful stop the Node.js program ( such as graceful offline RPC services, so that can prevent service interrupt ).
3. The structured log management, and configure capabilities.
4. Manage start order (dependency relationship) in the process.

A simple example as below:

`procfile.js`
 
```javascript
module.exports = function (pandora) {

  pandora
  
    // Define a service, named httpServer, implement on ./httpServer
    .service('httpServer', './httpServer')
    
    // Config it
    .config({
      port: 1338
    })
    
    // Allocate to 'worker' process group, actually you doesn't have to be written, the default is 'worker'.
    // Pandora.js built-in a 'pandora.process('worker').scale('auto')' definition.
    .process('worker');
    
};
```

`httpServer.js`

```javascript

const http = require('http');

module.exports = class HTTPServer {

  // Passed a context object when constructed
  constructor(serviceContext) {
    console.log(serviceContext);
    this.config = serviceContext.config;
    this.logger = serviceContext.logger;
  }
  
  // Standard start() interface
  async start () {
  
    this.server = http.createServer((req, res) => {
      
      // Standard logger object, the will logged into ${logsDir}/${appName}/service.log
      this.logger.info('Got a request url: ' + req.url);

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello Pandora.js');
      
    });
    
    

    // Standard start interface，await for server to listen succeed
    await new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (err) => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
    
    console.log('Listens on http://127.0.0.1:' + this.config.port);
    
  }
  // Standard stop interface, there will be a 5 seconds time window at the stop to deal with the work
  async stop () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
    console.log('Service stopped');
  }
};
```

Then we can start with the following commands:

```bash
$ pandora dev
Listens on http://127.0.0.1:1338
2017-12-11 14:34:22,340 INFO 21481 Process [name = worker, pid = 21483] Started successfully!
** Application start successful. **
```

We can saw `Listens on http://127.0.0.1:1338`, The service has been successfully started.

Open `http://127.0.0.1:1338`, that already been available, and at `${logsDir}/${appName}/service.log` you can also see that the log is already written.

Then press `Ctrl + c` to stop, We can also see the output of `Service stopped`.

## Pandora dev and pandora start

1. Pandora dev mainly used for local debugging, does't start daemon, and start application at front.

2. Pandora start mainly used for production environment, use daemon to protect applications, and start application at background.

In the `procfile.js`, you can use the following statement to decide environment:

```javascript
if (pandora.dev) {
  // started by pandora dev
} else {
  // started by pandora start
}
```

## Built-in default definition

`procfile.js` has some default behavior in order to facilitate use:

```javascript

// Define default process of service allocation.
pandora.defaultServiceCategory('worker');

// Define 'worker' process, we just talked about.
pandora.process('worker')
  // Scale this process, in dev mode only start one, in production environment start the number CPUs.
  .scale(pandora.dev ? 1 : 'auto')
  // Define environmental variables
  .env({worker: 'true'});

// Define a background task process, named 'background'.
pandora.process('background')
  // Only start one by default.
  .scale(1)
  .env({background: 'true'});

// Define basic LoggerService
pandora.service('logger', LoggerService)
  /**
  * The process is not defined and will start, it will start when only some services has assigned.
  * The .process('worker') means allocate to 'worker' process
  * The .process('all')  means allocate to all processes
  * The .process('weak-all') means allocate to all available processes, available process means in this process has some services already allocated (without 'weak-all').
  */
  .process('weak-all');

```
