# 一些默认监控

我们实现了一些基础的监控类，也提供了一些基础的功能，以后也会逐步添加，当然，如果你实现了一个公共的监控模块，也欢迎大家的贡献。

## EndPoint

### 基类

| Class          | Description                   |
| :------------- | :---------------------------- |
| EndPoint       | 所有 EndPoint 的基类，实现了基础的 IPC 通信 |
| DuplexEndPoint | 基础的双工通信采集端，比如错误采集继承了此类        |


### 一些实现类
| Class           | Description                       | Resource |
| :-------------- | :-------------------------------- | :------- |
| ErrorEndPoint   | 错误日志采集端，靠拦截 logger通过 IPC 内部转发机制实现 | /error   |
| InfoEndPoint    | 应用基础信息采集端，比如应用名，package.json，目录等  | /info    |
| MetricsEndPoint | metrics 指标采集端                     | /metrics |
| HealthEndPoint  | 健康检查采集端                           | /health  |
| ProcessEndPoint | 进程信息采集端                           | /process |


## Indicator

### 基类
| Class           | Description                            |
| :-------------- | :------------------------------------- |
| Indicator       | 所有的 Indicator 的基础类，实现了基础的 IPC 通信       |
| DuplexIndicator | 一个双工 Indicator 的基础类                    |
| HealthIndicator | 健康检查的基类，规范化了默认的返回行为，因为健康检查只需要返回成功或者失败。 |

### 实现类

| Class                    | Description    |
| :----------------------- | :------------- |
| DiskSpaceHealthIndicator | 实现了磁盘健康检查      |
| PortHealthIndicator      | 实现了端口健康检查      |
| BaseInfoIndicator        | 实现了基础信息的采集     |
| ConfigIndicator          | 实现了运行时配置信息的采集  |
| ErrorIndicator           | 实现了错误信息的动态采集   |
| NodeIndicator            | 实现了 Node 数据的采集 |
| ProcessIndicator         | 实现了进程信息的采集     |


## Reporter

### 基类

自定义实现可以继承。

| Class                    | Description        |
| :----------------------- | :----------------- |
| ScheduledMetricsReporter | Metrics 输出的基类，定时执行 |
| CustomReporter           | 自定义监控的输出基类         |


### 内置的实现类

| Class                     | Description      |
| :------------------------ | :--------------- |
| ConsoleReporter           | 输出 Metrics 到命令行  |
| FileMetricManagerReporter | 输出 Metrics 到特定文件 |

## Metrics

我们实现了一些基础的 MetricsSet ，采集了基础的应用 Metrics。

| Class                   | Description |
| :---------------------- | :---------- |
| V8GaugeSet.ts           | v8 的指标      |
| CpuUsageGaugeSet.ts     | cpu 使用率     |
| DiskStatGaugeSet.ts     | 磁盘使用率       |
| NetTrafficGaugeSet.ts   | 网络流量监控      |
| SystemLoadGaugeSet.ts   | 系统负载        |
| SystemMemoryGaugeSet.ts | 内存监控        |
| TcpGaugeSet.ts          | TCP 数据监控    |

