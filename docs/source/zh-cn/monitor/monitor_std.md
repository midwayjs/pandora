title: 监控体系总览
---

在业界应用的监控已经是很常见的了，特别是分布式系统中，监控已经是不可获取的一部分，而 Metrics 作为监控的一大标准，已经出现在各个地方，最近在微服务领域也有 Metrics 的身影，通过它，我们可以可以了解系统的运行状况，健康状况，性能状况等等，通过对历史数据的分析，也可以帮助我们发现系统缺陷和避免系统不稳定的发生。

Pandora.js 提供了一套简单的监控机制，包含但不限于 Metrics，让用户可以在应用中采集自己的数据，并且通过一定的机制可以让外部系统收集和计算。

Pandora.js 的整个监控体系分为两个大部分，数据采集机制和数据透出机制，我们将一一来描述。

## 数据采集机制

Pandora.js 的数据采集分为几块内容，简单来说，分为 `服务端` 和 `客户端` ，基本上是一对多的关系，一个服务端接受多个客户端的返回数据，并且汇总，储存在内存中。

数据的采集是通过 `EndPoint` 和 `Indicator` 来完成的。

### EndPoint 采集机制

`EndPoint` 可以看做服务端，用来接收客户端返回的数据。

而客户端，我们叫做 `indicator`，用来真正执行逻辑，将数据上报给服务端。

而服务端和客户端通过 IPC 进行通信，这样对应的模型就变成了以下的样子。

![img](https://img.alicdn.com/tfs/TB1iGClih6I8KJjy0FgXXXXzVXa-462-199.png)

我们有一些比较常用的 EndPoint ，比如健康检查，运行时数据访问等，只要是希望通过客户端披露的，都可以通过 EndPoint 机制来完成。


### Metrics 采集机制

标准的 metrics ，支持几种标准类型

- Gauge 瞬时值
- Counter 计数器
- Meter 吞吐率度量器
- Histogram 直方分布度量器
- Timer 吞吐率和响应时间分布度量器

Pandora.js 对这几种类型都做了一定程度的支持，但是 Gauge 和 Counter 类型最为常用。

这些类型有一些基础类，也有一些实现类，在使用的时候可以自行选择。

## 数据透出

每个 EndPoint ，采集了各种各样的数据，但是还不能被用户或者外部采集器获取，所以我们定义了两种不同的方式来进行对外暴露，Resource 和 Reporter 机制就是其中的两种策略。

### Resource 机制

在应用运行中，虽然有 EndPoint 在服务端汇总客户端的数据，但是用户依旧无法获取或者接触到这部分的数据，我们设计了一套 Resource 机制，将 EndPoint 的结果通过 HTTP 协议暴露出来，这样用户就能直观的拿到这些结果。

比如健康检查，我们提供了 `/health` 路由，这样用户可以通过该路由直接拿到每个客户端的状态，如果这些客户端埋入到了中间件中，就能直接获取中间件的状态。

### Reporter 机制

这是另一种对外暴露数据的方式，我们往往采集了数据还不够，还需要进行数据存储，分析，再加工，而 Pandora 不做这些事情，而需要外部的 APM 平台来做，比如 oneApm 或者 open-falcon 等，这个时候 Reporter 就有用了。

Reporter 定义了一系列数据输出方式，默认的有一些：

* ConsoleReporter 通过命令行输出 MetricsEndPoint 的内容
* FileMetricsManagerReporter 通过 metrics.log 文本来输出 MetricsEndPint 的内容


> 注意，MetricsEndPoint 是一个特殊的存在，大多数 APM 只需要采集这个 EndPoint，如果框架或者用户想采集其他的 EndPoint，可以通过 Resource 暴露的 HTTP API 或者自定义 Reporter 的方式。


当然你也可以自定义 Reporter，把数据发送到不同的地方，我们也提供了一些外部 APM 的 Reporter，请通过 [这里](https://www.npmjs.com/search?q=pandora-reporter) 查看。

