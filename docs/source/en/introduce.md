title: What is Pandora.js ?
---

## Background

As a consequence of years of experiences on enterprise Node.js applications management, Midway team from Alibaba open-sourced Pandora.js finally. It is an application manager integrates many capabilities like monitoring, debugging, resiliency. You are more than welcome to use it, as well as build your operation infrastructure upon it.

The main concepts of Pandora.js are:

1. Manageable
  * Standard management capabilities of applications, processes and basic services (such as middleware).
  * Graceful online/offline.
  * Inter-process object proxying.
2. Measurable
  * Be able to measure different aspects of applications.
  * Support tons of metrics types, gauge, counter, meter, histogram, etc.
3. Traceable
  * Be able to trace the whole execution stack, inspect applications at runtime.
  * Support tons of 3rd party middlewares, MySQL, redis, etc. 
  * Compatible with Open-Tracing standard

The data can be achieved via RESTFul API or local file system. It is super easy to integrate it with your monitoring system.


## Abstract


> Note: In this documentation, Both pandora and pandora.js refer to the same concept, which is the Pandora.js project.

Pandora.js is an Application Manager for Node.js Applications represented by [Alibaba Group](http://www.nasdaq.com/symbol/baba).


The duties and responsibilities:

* Provides a general Node.js application runtime model and related infrastructure
  * Multi-process model
  * Infrastructure and specification for application frameworks (e.g. service feature)
  * A stable middleware SDK client and a consistent interface
* Provide a standard DevOps tool for Node.js
  * Operation and maintenance API in each layer
  * Monitoring capabilities, such as the Metrics and Trace 
    
Each part of The Pandora.js includes a specification and a standard implementation. Each business domain can implement its own application layer framework based on the standard. For examples: 

* Pandora.js provides a standard to integrate middlewares, and manage dependencies.
  * For web domain, such as the midway framework (Alibaba internal)
  * For micro service framework, it can also solve the infrastructure related problems such as middleware, logger, operation and maintenance specification based on Pandora.js.


## Design principles
   
In the Node.js environment without threads, more and more applications choose to use Cluster mode to run multiple processes, which max the CPU performance. However, complicated process models and IPC could be difficult to manage. People may also encounter framework selection dilemma. I just want to get a burger, but give me a set meal.
   
We hope the business logic pure and simple. Application development cares only about the business part, leaves deployment and operation job quite easy to done.
   
![img](https://img.alicdn.com/tfs/TB1wR5mib_I8KJjy1XaXXbsxpXa-826-434.png)

We believe `ops first`, as applications generate business value at runtime. Thus we empower Node.js applications with runtime operation capabilities. We adopt the metrics standard and open-tracing standard, so you can customize it easily and integrate with your own infrastructure.

## Some features of Pandora.js

- Providing different kinds of frameworks, and the ability to start and stop a single file.
- Providing multi applications management and deployment capabilities
- Providing local development and debugging capabilities
- Providing process define capabilities
- Providing Metrics API and Trace API, and those abilities can easily integrate to 3rd APM.
