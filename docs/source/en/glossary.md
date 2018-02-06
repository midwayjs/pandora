title: Glossary
---

There are some "key words" in the Pandora.js, the definition of those words may be different with ordinary users understanding, following explanation to help you better understand.


## Basic part

### procfile.js

> Process structure definition file
  
A description file to defines the process structure of the application.

### Application

> Application

The meaning of application is not very different with the general situation. 

### Fork 

> Based on require('child_process').fork();

Simply start a Node.js application.

### Cluster 

> Based on require('cluster');

Create a master / worker model process group based on the cluster module.

### Service

> Service

A Service implementation followed the standard service start and stop interfaces.

Detail:

1. For example, initialize or stop of a lot of the basic middleware SDK.
2. Start or stop the main program of the application.
3. A standard object proxy can be created by a service, that can be invoked across the IPC-Hub in other process.

### Process

> Process

Same meaning.

## Metrics part

### EndPoint

> EndPoint

EndPoint is a data aggregation end of every different type, its function is to classify or aggregate the collected data.

Example: there are different EndPoints, such as MetricsEndPoint, used to collect the metrics; HealthEndPoint is used to manage the application health status; ErrorEndPoint is used to collect the error logs.

### Indicator

> Indicator

The client part of the EndPoint, each EndPoint relates to the multiple indicators, which is connected by the IPC.

Each Indicator contains specific data values, such as a specific error, a specific configuration object, and so on.


### Actuator

> Actuator

The actuator has two major functions:

1. Disclosing the data to the outside. Expose public services, such as the HTTP Service, the CLI Service.
2. Managing the EndPoint objects
  

