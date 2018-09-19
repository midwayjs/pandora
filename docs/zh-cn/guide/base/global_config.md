# 全局配置

Pandora.js 设计了一套配置文件，希望能和应用的配置进行隔离，毕竟 Pandora.js 可能会在全局场景下应用，导致不一样的情况发生。

Pandora.js 设计了一套简单有效的配置覆盖机制，用户可以通过配置文件的形式，对默认的行为做一些修改。

我们通过 `PANDORA_CONFIG` 这个环境变量来注入配置包，这个配置包可以是一个文件，如果内容比较多，也可以是一个 npm 包，能直接 require 即可。

```sh
PANDORA_CONFIG=pandora-ali pandora start .
PANDORA_CONFIG=./index.js pandora start .
```

文件的内容**只需要写覆盖的部分**

## 通过命令行加载多配置

本质上，配置的覆盖就只是配置文件内容的覆盖，所以只需要做好分割就好。

注意：Pandora.js 使用 `:` 作为分隔符来分割多个路径。

```sh
$ export PANDORA_CONFIG=pandora-ali:./index.js
$ pandora start
```


## 默认的全局配置

该文件维护在 [default.ts](https://github.com/midwayjs/pandora/blob/master/packages/pandora/src/default.ts).

Pandora.js 提供了一组默认的配置来保证基础脚本的运行，一般指定了几项标准的内容：

- [actuator 监控的配置，主要为 EndPoint](../monitor/endpoint.html)
- [reporter 监控上报的配置](../monitor/report.html)
- [environment 标准的环境实现类](../process/environment_std.html)

在这些key的基础上，进行覆盖，增加操作，默认配置如下，可能有变化，具体见代码详情。

下文中所有的自由变量（即没有声明来源的量，比如 DefaultEnvironment），全部可以通过 `require('dorapan')` 或 `require('pandora')` 获得。

```javascript
export default {
  
  // 配置环境实现类
  environment: DefaultEnvironment,
  
  actuator: {
    
    // RESTful 接口进行配置
    http: {
      enabled: true,
      port: 7002, // 默认监听在 7002 端口
    },

    // 配置 EndPoints
    endPoint: {
      
      // 错误采集的 EndPoint
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          // 错误缓存大小，保留最近多少条错误
          maxErrorCount: 100
        }
      },
      
      // 健康检查的 EndPoint
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          // HTTP 检查
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          // 磁盘检查
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      
      // 应用信息的 EndPoint
      info: {
        // 应用信息
        enabled: true,
        target: InfoEndPoint,
        resource: InfoResource,
      },
      
      // 进程信息的 EndPoint
      process: {
        // 进程信息
        enabled: true,
        target: ProcessEndPoint,
        resource: ProcessResource,
      },
      
      // 自定义 Metrics 的 EndPoint
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource,
        initConfig: {
          collector: NormalMetricsCollector
        }
      },
      
      // 链路追踪的 EndPoint
      trace: {
        enabled: true,
        target: TraceEndPoint,
        resource: TraceResource,
        initConfig: {
          // 缓存最近 1000 条链路
          cacheSize: 1000,
          // 采样率
          rate: process.env.NODE_ENV !== 'production' ? 100 : 10,
          // 优先级高的链路是否跳出采样率限制，比如错误的链路
          priority: true 
        }
      }
    },
    
  },
  
  // 数据上报 Reporter 的配置
  reporter: {
    file: {
      enabled: true,
      // 默认实现把 Metrics 日志写到 ~/logs/pandorajs/metrics
      target: FileMetricsManagerReporter,
      interval: 5
    }
  },
  
  // 应用日志的配置
  logger: {
    // 日志目录
    logsDir: join(homedir(), 'logs'), 
    // 每个应用的日志配置，基本上就是 Stdout
    appLogger: { 
      // 默认不输出到 Daemon 的 Stdout，请务必不要改变这一配置
      stdoutLevel: 'NONE', 
      // 默认记录 Info 信息，比如应用启动停止，建议保持 INFO
      level: 'INFO' 
    },
    // Service 的日志是否分散为单个日志文件，建议保持 false
    isolatedServiceLogger: false 
  }
  
};

```

