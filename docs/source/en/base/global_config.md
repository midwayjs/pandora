title: Configuration
---

Pandora.js designed a set of configuration files, hoping to isolate the configuration of the application in different global scenario, causing the same results.


## Default Configuration

Pandora.js provides a set of default configuration to ensure start correctly, By default there are some standard content:

- environment - Standard implementation class of environment
- actuatorServer - Implementation class of monitor server
- actuator - Implementation description of monitor server
- reporter - Reporter description of reporter


Based on these keys, covering, adding operations to modify configuration. Here is the default configuration, it may be changed in code.

```javascript
export default {
  environment: DefaultEnvironment,
  actuatorServer: MetricsActuatorServer,
  actuator: {
    http: {
      enabled: true,
      port: 8006,
    },

    endPoint: {
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          maxErrorCount: 100
        }
      },
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      info: {
        enabled: true,
        target: InfoEndPoint,
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
      },
      runtime: {
        enabled: true,
        target: RuntimeEndPoint
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource
      }
    },
  },
  reporter: {
    file: {
      enabled: true,
      target: FileMetricManagerReporter,
      interval: 5
    }
  }
};

```

Pandora. js designed a simple and efficient configuration coverage mechanism that users can make some changes to cover default behavior.

We injected the configuration package with the `PANDORA_CONFIG` environment variable, this configuration package can be directly require like a file, or a npm package.

```sh
PANDORA_CONFIG=pandora-ali pandora start .
PANDORA_CONFIG=./index.js pandora start .
```

The content of the file: **Only write the part which you want to cover**

## Load multiple configurations from the command line

In essence, cover configuration is just cover the object from other configuration file, so only need to split file path.

Notice: Pandora.js uses `:` as a delimiter to split multiple paths

```sh
PANDORA_CONFIG=pandora-ali:./index.js pandora start .
```
