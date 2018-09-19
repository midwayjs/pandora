# 关键术语

Pandora.js 里会有一些 “关键词”，这些词的定义可能和普通用户的印象不同，以下会列出这些关键词的释意，以帮助大家更好的理解。


## 通用部分

### procfile.js

> 进程描述文件

定义应用进程结构的描述文件。

### Application

> 应用

应用的意义和普通情况差别不大，大多数情况下，一个仓库的代码即为一个应用，特殊情况下，一个代码仓库可能会包含多个应用。

### Fork 

> 基于 require('child_process').fork();

简单的启动一个 Node.js 程序。

### cluster 

> 基于 require('cluster');

基于 cluster 模块创建 master / worker 的进程组。

### Service

> 服务

Service 我们的定义为 —— 响应标准启动、停止的服务实现。

具体为：

1. 比如很多基础的中间件 SDK 的初始化、停止。
2. 应用主程序的启动、停止。
3. 可以跨进程间调用的服务，创建标准对象代理。

### Process

> 进程

含义不变。

## Metrics 部分

### EndPoint

> 端

EndPoint 是每个不同类型的数据聚合端，它的功能是将采集的数据进行分类聚合，该缓存的缓存，该处理的处理。

例：有不同的 EndPoint，比如 MetricsEndPoint，用于收集 Metrics；HealthEndPoint，用于管理应用健康状况；ErrorEndPoint，用于收集错误日志。

### Indicator

> 指示器

EndPoint 的客户端部分，每个 EndPoint 会对应到多个 Indicator 的数据，两者之间通过 IPC 通道相连。

每个 Indicator 包含具体的数据值，比如一条具体的错误，一个具体的配置对象等等。

### Actuator

> 执行器

执行器有两大功能：

1、对外提供服务，比如 http 或者 console 服务，将数据对外披露
2、管理 EndPoint 对象
