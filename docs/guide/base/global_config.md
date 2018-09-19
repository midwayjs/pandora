# Global Config

Pandora.js designed a set of configuration files, hoping to isolate the configuration of the application in different global scenario, causing the same results.

Pandora. js designed a simple and efficient configuration coverage mechanism that users can make some changes to cover default behavior.

We injected the configuration package with the `PANDORA_CONFIG` environment variable, this configuration package can be directly require like a file, or a npm package.

```sh
PANDORA_CONFIG=pandora-ali pandora start .
PANDORA_CONFIG=./index.js pandora start .
```

The content of the file: **Only write the part which you want to override**

## Load multiple configurations from the command line

In essence, cover configuration is just cover the object from other configuration file, so only need to split file path.

Notice: Pandora.js uses `:` as a delimiter to split multiple paths

```sh
$ export PANDORA_CONFIG=pandora-ali:./index.js
$ pandora start
```

## Default Configuration


This file maintained at [default.ts](https://github.com/midwayjs/pandora/blob/master/packages/pandora/src/default.ts).

Pandora.js provides a set of default configuration to ensure start correctly, By default there are some standard content:

- [actuator - Monitoring config, basic is EndPoints](../monitor/endpoint.html)
- [reporter - report monitoring data](../monitor/report.html)
- [environment - standard environment implementation](../process/environment_std.html)


Based on these keys, covering, adding operations to modify configuration. Here is the default configuration, it may be changed in code.

All of the following free variables (that is, not declared, such as DefaultEnvironment) are all available via `require('dorapan')` or `require('pandora')`.

```javascript
export default {
  
  // Config Environment Implementation
  environment: DefaultEnvironment,
  
  actuator: {
    
    // Config actuator's RESTFul server
    http: {
      enabled: true,
      port: 7002, // listen on 7002 by default
    },

    // Config EndPoints
    endPoint: {
      
      // Config error collection endPoint
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          // Errors cache size, how many recent errors to cache
          maxErrorCount: 100
        }
      },
      
      // Config health check endPoint
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          // HTTP Check
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          // Disk Check
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      
      // Config application info collection endPoint
      info: {
        enabled: true,
        target: InfoEndPoint,
        resource: InfoResource,
      },
      
      // Config process info collection endPoint
      process: {
        enabled: true,
        target: ProcessEndPoint,
        resource: ProcessResource,
      },
      
      // Config custom metrics endPoint
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource,
        initConfig: {
          collector: NormalMetricsCollector
        }
      },
      
      // Config trace EndPoint
      trace: {
        enabled: true,
        target: TraceEndPoint,
        resource: TraceResource,
        initConfig: {
          // Traces cache size, how many recent errors to cache
          cacheSize: 1000,
          // Sampling rate
          rate: process.env.NODE_ENV !== 'production' ? 100 : 10,
          // If the trace with the highest priority is out of the sample rate limit,
          // such as a wrong trace.
          priority: true 
        }
      }
    },
    
  },
  
  // Config monitoring data reporters
  reporter: {
    file: {
      enabled: true,
      // Default implementation is FileMetricsManagerReporter
      // FileMetricsManagerReporter write Metrics to ~/logs/pandorajs/metrics.log as a log file.
      target: FileMetricsManagerReporter,
      interval: 5
    }
  },
  
  // Config application logs
  logger: {
    // log directory
    logsDir: join(homedir(), 'logs'), 
    // Log configuration for each application, basically stdout
    appLogger: { 
      // Please make sure you do not change this configuration by default without output to the stdout of daemon
      stdoutLevel: 'NONE', 
      // Default record INFO information, such as application start or stop, is recommended to keep INFO
      level: 'INFO' 
    },
    // Service log is scattered into a single log file, it is recommended to keep false
    isolatedServiceLogger: false 
  }
};

```

