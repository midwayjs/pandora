title: 使用和扩展 EndPoint
---

EndPoint 是预埋在 Daemon 端的一组接收器，用于接收每个进程的 Indicator 数据，这些数据按照应用来分组。

在默认的场景下，我们会预埋一些 EndPoint，用户可以对这些东西全部自定义。

## 定义 EndPoint

每个 EndPoint 都包含一个 name 用于标识该 EndPoint 的唯一性，同时，由于 EndPoint 的初始化都在 Daemon 中，所以每个 EndPoint 实例都只存在唯一的一个。

一般来说，EndPoint 用户自定义概率不高，主要是 Indicator 需要埋入到业务脚本中。

每个 EndPoint 是一个 IPC 服务器，用于接收 Indicator 调用的结果，并进行汇总，最为常用的两个方法就是 `invoke` 和 `processQueryResults`，定义如下：

```javascript
export interface IEndPoint {
  indicators: Array<IIndicator>;
  group: string;
  /**
   * 调用名下指标
   * @param appName
   * @param args
   */
  invoke(appName: string, args?: any);

  /**
   * 处理查询返回结果
   */
  processQueryResults(results?: Array<IIndicatorResult>): any;
}
```

在代码内部我们使用了接口来进行定义，我们对 EndPoint 增加了一个 group 字段，这样 Indicator 只要配置里这个 group，就可以上报到同一个 EndPoint 上。

## 定义 Indicator

每个 Indicator 是一个 IPC 客户端，可以在不同的进程中初始化，我们使用 pid 作为区分，所以一般来说，一个进程只允许一个同名的 Indicator 存在，在 cluster 模式下，Indicator 就可以以多个的形式通过同一个 group 上报给 EndPoint。

Indicator 有几个重要的字段，和 EndPoint 类似，`group` 表示对应连接到哪个 EndPoint，而 `invoke` 方法则是真正的调用执行的地方。

```javascript
/**
 * 单个指标
 */
export interface IIndicator {
  group: string;
  invoke(data?: any, builder?: IBuilder);
}
```


## 一些配置约定

不同版本的配置可能会有些增减，但是大致的配置如下：

```javascript
export default {
  actuator: {
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
      process: {
        enabled: true,
        target: ProcessEndPoint,
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource
      }
    },
  },
  ...
};

```

每个 EndPoint 都有几个通用的配置

- name {String} 名字，全局唯一就行
- enabled {Boolean} 是否启用
- target {IEndPoint} 对应的 EndPoint 类 
- resource {ActuatorResource} 对应的 Resource 类
- initConfig {Object} 初始化配置

```javascript
metrics: {
  enabled: true,
  target: MetricsEndPoint,
  resource: MetricsResource
}
```

以上就是 EndPoint 的配置方法。
