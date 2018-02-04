title: What is the Pandora.js ?
---

## Background

The Pandora.js project is the first time of Alibaba Midway team to open source. and it also is a perfect summary of the Node.js operation, management and monitoring of the production environment of Alibaba in these years since 2014.


The main concepts of the Pandora.js has three points, Manageable, Measurable and Traceable:

1. Manageable
  * The standard management capabilities of applications, processes and basic services (such as middleware).
  * Graceful online/offline.
  * inter-process object proxying.
  * and so on.
2. Measurable
  * The Metrics capability can measure any part of the application.
  * May types, such as gauge value, counter, meter, histogram, and so on.
3. Traceable
  * Open-Tracing standarded tracking capability for business logic link.
  * It can track each request has queried several times MySQL, several times Redis and so on. 
  * Inspect business logic link is no longer difficult.

All of the above data and capabilities are all passed to the RESTFul API or the text log file, so you can easily integrate that into your business environment.


## Abstract


> Note: In this documentation, Pandora and Pandora.js all refer to the same thing, that all means the Pandora.js project.

Pandora.js is an Application Manager for Node.js Applications represented by [Alibaba Group](http://www.nasdaq.com/symbol/baba).


The duties and responsibilities:

* Provides a general Node.js application runtime model and related infrastructure
  * Multi process model
  * Providing infrastructure and specification for application frameworks ( such as the service feature )
  * Provides a stable middleware SDK client and a consistent interface
* Provide a standard DevOps tool for Node.js
  * Pandora.js operation and maintenance API in each layer
  * Monitoring capacity, such as the Metrics and Trace 
    
Each part of The Pandora.js includes a specification and a standard implementation. In principle, each business domain can implement its own application layer framework based on this standard. For examples: 
* Pandora.js provides a standard to Integrated middleware, And management dependencies.
* For Web domain, such as the midway framework (Alibaba internal)
* For micro service framework, it can also solve the infrastructure related problems such as middleware, logger, operation and maintenance specification based on Pandora.js.


## Design principles
   
In the Node.js environment without threads, more and more applications choose to use Cluster mode to run multiple processes, which makes the performance to an ideal degree. However, the complex process models and IPC make many users fear it. In a lot of company users, we also often encounter framework selection difficulties. I just want to get a burger, but give me a set meal.
   
We hope the business logic pure and simple, and only care about the business part. so that the local development and online deployment will be quite easy to done.
   
![img](https://img.alicdn.com/tfs/TB1wR5mib_I8KJjy1XaXXbsxpXa-826-434.png)

Of course, if the Pandora.js can only start and stop the application, that is too Big deal. Application operation has been a difficult problem, in the `Ops first` today, we combine the Metrics standard and Open-tracing Standard. Through those, you can get custom monitoring invoke link tracing and so on so on. that is bound to open the intelligent monitoring of Node.js.

## A part of features of the Pandora.js

- Providing different kinds of frameworks, and the ability to start and stop a single file.
- Providing multi applications management and deployment capabilities
- Providing local development and debugging capabilities
- Providing process define capabilities
- Providing Metrics API and Trace API, and those abilities can easily integrate to 3rd APM.
