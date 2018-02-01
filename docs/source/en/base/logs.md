title: Log management
---

## Log directory structure

Based on the directory specification, we have agreed on the following directory structure.

```js
- ${loggDir}
	- pandorajs
		- deamon.log // Pandora.js deamon log
		- metrics.log 
	- $appName
		- nodejs_stdout.log // nodejs ouput log
		- error.log // Application of self-defined log files
	- $appName2 // application use egg framework
		- nodejs_stdout.log
		- common-error.log
		- ... 
```

## Node. js standard output

1. Pandora. js will write stdout at `${logsDir}/${appName}/nodejs_stdout.log`
2. log will be reload by date


## Automatic log cleaning

Pandora.js has cut the log by day (or size), and does not provide log cleaning. You can configure a simple `crontab` for` ~ / logs`, like [similar tutorial](https://www.cnblogs.com/peida/archive/2013/03/25/2980121.html)。

## Log default configuration

Log behavior can be configured by global configuration, like:

```javascript
{
  logger: {
    logsDir: join(homedir(), 'logs'), // log directory
    appLogger: { // Log configuration for each application, basically stdout
      stdoutLevel: 'NONE', // Please make sure you do not change this configuration by default without output to the stdout of daemon
      level: 'INFO' // Default record INFO information, such as application start or stop, is recommended to keep INFO
    },
    isolatedServiceLogger: false // Service log is scattered into a single log file, it is recommended to keep false
  }
}
```

## Log Level

1. ALL - All level
2. DEBUG - DEBUG and below
3. INFO - INFO and below
4. WARN - WARN and below
5. ERROR - ERROR and below
6. NONE - No output


## Create custom logs

You can create by  `require('dorapan').getService('logger').createLogger(name, config)` ，and config is defined as follows下：


```
{
  dir: string; // log directory
  stdoutLevel: string; // stdout level，default is ERROR
  level: string; // the log of file ouput level，default is WARN
  type: string; // the type of log cutting type， optional date and size，default is date
  rotateDuration?: number; // the check during time of log file size to cut，unit is millisecond
  maxFiles?: number; // The maximum number of file by size cut
  maxFileSize?: number; // The maximum file size by sise cut
}
```
More detail [LoggerService](http://www.midwayjs.org/pandora/api-reference/service-logger/classes/loggerservice.html)。

## Connect to log service

Discussion：<https://github.com/midwayjs/pandora/issues/50>
