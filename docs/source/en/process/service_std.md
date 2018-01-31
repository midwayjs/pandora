title: Custom service
---


## What is Service?

Service is also like `process('x).entry('./y.js')` similarly, define the Node.js program in the process. But it's more structured, and provides the following basic capabilities:

1. The standard `async start()` interface allows the user to asynchronous start the Node.js program.
2. The standard `async stop()` interface allows users to have elegant offline Nodes.js programs (for example, elegant offline RPC services, to avoid service flash break).
3. Structured log management, and configure capabilities.
4. Start-up order (dependency relationship) management in the process.

## How to get Service

1. User can be obtained by `require('dorapan').getService(serviceName)`.
2. This method is also available in the Service builder with the passed-in ServiceContext.

## How to define Service

Process is defined in procfile.js, depending on the following syntax:

`procfile.js`

```javascript
module.exports = function (pandora) {
  pandora
    .service('serviceName', './service.js');
}
```

`pandora. service('serviceName', './service.js')` means that defines a Service called `serviceName`, and define the implementation of the Service in `./service.js`.

The second parameter can also pass a reference to an implementation class in addition to passing a relative path.
In the end, the statement returns an object, [ServiceRepresentationChainModifier](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicerepresentationchainmodifier.html).

We can use [ServiceRepresentationChainModifier](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicerepresentationchainmodifier.html) to improve the definition of this service.

The following is a simple example of all of the definition capabilities:

`procfile.js`

```javascript
module.exports = function (pandora) {

  // Define a service named serviceA
  // The second parameter is a specific implementation, can be an address, or a reference to an implementation class
  // If the second parameter is not passed, the defined Service are modified
  pandora('serviceA', './ServiceA')

    // Rename Service
    // Obtained without passing parameters
    .name('renameIt')

    // Specify the process that is assigned to, by default being worker
    // You can use `pandora.defaultServiceCategory('worker')` to modify the default value.
    // Obtained without passing parameters
    .process('worker')

    // Configure to Service
    // Obtained without passing parameters
    .config({
      port: 5555
    })

    // Define dependency, the following means that the serviceX must start with this service
    // Obtained without passing parameters
    .dependency(['serviceX'])


    // The service is published at the IPC-Hub, specifically refer to the [《Inter-Process Communication Hub》](http://www.midwayjs.org/pandora/zh-cn/process/ipc_hub.html)
    // .publish(false) To cancel the release
    .publish()

    // Drop: (Delete) the service definition
    .drop()
}
```

### The value of `serive().process(processName: string)`

The `processName` in `service().process(processName: string)` can have the following values:

1. A process name that has been defined.
2. 'weak-all', all processes that have been activated (via entry or other Service), but they do not activate any processes themselves.
3. 'all', all processes that defined (Will activate all defined processes, including built-in default definitions, not recommended for use).

### Modify the Process for the default allocation

Use the `pandora.defaultServiceCategory()` mentioned above to modify.

```javascript
module.exports = function(pandora) {
  pandora.defaultServiceCategory('processName');
}

```

## How to implement a Service

Each service is a Class that needs to implement 0 required interfaces, and four optional interfaces.

**new (context: [ServiceContextAccessor](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicecontextaccessor.html))**

> Optional, the first parameter of the builder is a ServiceContextAccessor, the service context object, as described below.

**start(): Promise&lt;void&gt; | void**

> Optional, life cycle methods, start the service.

**stop?(): Promise&lt;void&gt; | void**

> Optional, life cycle methods, stop the service. The Pandora.js gives a 5-second time window for an elegant exit at the time of the stop.

#### Static attribute, method constraint

**dependencies: string[]**

> Optional, also known as the static property in the class system. Define the dependency of a certain service.

## The main interface provided by ServiceContextAccessor

There are a lot of attributes and methods on this, specific reference [ServiceContextAccessor](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicecontextaccessor.html) API. Here are a few common:

#### Primary attribute

**serviceName: string**

> The name of Service

**config: any**

> Configuration for Service, defined in `.service().config({ key: 'value' })`.

**dependencies: { [depName: string]: Service }**

> All the Service instance that dependent.

**logger: ServiceLogger**

> Service proprietary log objects, log file to `${logsDir}/${appName}/service.log`.

### Unit test

You can directly `new` your implementation class to write the unit test.
