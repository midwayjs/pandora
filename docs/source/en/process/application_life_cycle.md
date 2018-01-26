title: Application Life Cycle
---

As an application manager, Pandora.js can manage application's life cycle at 5 stages:

- Representation Stage
- Initialization Stage
- Injection Stage
- Launch Stage
- Shutdown Stage

## Representation Stage - procfile.js

Use `procfile.js` to define the application.

## Initialization Stage

Pandora.js can deploy multiple applications at the same time. By feeding the application root directory, Pandora.js would do some initialization works for the application, such as collecting meta information, initializing resource loader and context, etc.

## Injection Stage

There are several ways to do the injection:

1. Using global variable `PANDORA_CONFIG` 
2. Using the description file `procfile` 

Entities can be injected are listed as below:

1. Process：inject process definition.
2. Service：pandora.js managed services, whose lifecycle are managed by application manager.
3. Environment：environment object.

## Launch Stage

Create application context and start applications, invoke the `start()` method of services, such as HTTP service, etc.

## Shutdown Stage

Shut down the application as well as services via invoking `stop()` method. Daemon will wait at most 5 seconds for applications to exit gracefully.
