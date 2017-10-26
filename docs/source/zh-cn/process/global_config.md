# 全局配置覆盖

Pandora.js 设计了一套配置文件，希望能和应用的配置进行隔离，毕竟 Pandora.js 可能会在全局场景下应用，导致不一样的情况发生。

Pandora.js 提供了一组默认的配置来保证基础脚本的运行，一般指定了几项标准的内容：

- process 进程描述内容
- environment 标准的环境实现类
- configurator 配置获取类
- service 全局服务类
- actuatorServer 监控实现类
- actuator 监控描述内容
- reporter 上报实现

在这些key的基础删，进行覆盖，增加操作，默认配置如下，可能有变化，具体见代码详情。

```javascript
export default {
  process: {
    defaultCategory: 'worker',
    category: {
      agent: {
        order: 0,
        scale: 1,
        argv: [],
        env: {
          agent: 'true'
        }
      },
      worker: {
        order: 1,
        argv: [],
        scale: 'auto',
        env: {}
      },
      background: {
        order: 2,
        scale: 1,
        argv: [],
        env: {
          background: 'true'
        }
      }
    }
  },
  environment: DefaultEnvironment,
  configurator: DefaultConfigurator,
  service: {
    defaultCategory: 'all',
    injection: {
      'logger': {
        entry: LoggerService,
        config: (ctx) => {
          return ctx.config.loggerService;
        }
      }
    }
  },
  actuatorServer: MetricsActuatorServer,
  actuator: {
    http: {
      enabled: true,
      port: 8006,
    },

    endPoints: {
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

Pandora.js 设计了一套简单有效的配置覆盖机制，用户可以通过配置文件的形式，对默认的行为做一些修改。

我们通过 `PANDORA_CONFIG` 这个环境变量来注入配置包，这个配置包可以是一个文件，如果内容比较多，也可以是一个 npm 包，能直接 require 即可。


```sh
PANDORA_CONFIG=pandora-ali pandora start .
PANDORA_CONFIG=./index.js pandora start .
```

文件的内容**只需要写覆盖的部分**
