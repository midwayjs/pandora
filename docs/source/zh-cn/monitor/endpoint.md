# 使用 EndPoint



EndPoint 是预埋在 Daemon 端的一组接收器，用于接收每个进程的 Indicator 数据，这些数据按照应用来分组。

在默认的场景下，我们会预埋一些 EndPoint，用户可以对这些东西全部自定义。

## EndPoint 结构

每个 EndPoint 都包含一个 

## 使用 EndPoint 和 Indicator

一般来说，EndPoint 用户自定义概率不高，主要是 Indicator 需要埋入到业务脚本中。

**监控检查**

Pandora.js 提供了 `HealthEndPoint` 来做健康检查的能力，通过 `/health` 的路由即可访问。

默认我们提供了一些基础的检查，比如磁盘检查，端口检查等，如果需要修改其中的配置，可以在全局配置中进行覆盖调整。

`HealthEndPoint` 有相应的客户端来负责采集数据， 我们提供了 `HealthIndicator` 这个基础抽象类，用户只要实现它就能把健康检查给统一起来。

比如你要检查当前的远程服务器是否可用，就可以实现其中的 `doCheck` 方法。

```javascript

import 'HealthIndicator, HealthBuilder' from 'pandora-metrics';
import * as cp from 'child_process';

export class RemoteUrlHealthIndicator extends HealthIndicator {
  name = 'remote_url';

  doCheck(builder) {
    // check remote
    let result = cp.execSync(`curl -s --connect-timeout 1 -o /dev/null -w "%{http_code}" http://google.com`);
    if (result.toString() === '200') {
      builder.up();
    } else {
      builder.down();
    }
  }
}

```

在 `doCheck` 方法中，我们传入了一个 builder，用来简化返回结果，通过 `builder.up()` 和 `builder.down()` 来返回成功和失败。

这样，你访问 `http://127.1:8006/health` 的时候，就能看到名为 `remote_url` 的健康检查结果了。

大概如下：

```
{
  status: 'UP',
  remote_url: {
    status: 'UP'
  }
}

```

这里的格式是由 `HealthResource` 这个类定义的，健康检查看的是总体的一个结果，只要出现一个不正常，整体就不通过，所以 status 字段代表着总的一个状态，通过 'UP' 和 'DOWN' 来表示是否健康。



## 定义 EndPoint

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