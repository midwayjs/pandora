# 关键术语

Pandora.js 里会有一些 “关键词”，这些词的定义可能和普通用户的印象不同，以下会列出这些关键词的释意，以帮助大家更好的理解。


## 通用部分

### Application

> 应用

应用的意义和普通情况差别不大，大多数情况下，一个仓库的代码即为一个应用，特殊情况下，一个代码仓库可能会包含多个应用。


### Service

> 服务

集团有很多中间件，比如 hsf-client，diamond，configclient，tair 等，这些中间件区别于 `koa middleware`，有着本质的不同，不属于 web 请求流程，而是更富化的客户端，我们把这些客户端定义为 Service,即服务，以便和普通中间件做区分。

针对服务 Pandora.js 会有不同的使用方式，通过将包预埋在 Pandora.js 中，来达到版本控制和固化依赖的目的。

### Applet

> 小应用，小应用程序

这个名字是对应 Node.js 应用进程有着不同的功能而重新命名。

在 Pandora.js 的进程模型里，Node.js 应用的进程有这不同类型和功能，每个进程中抽象出了一些特定领域的 `applet`

比如一个进行可以同时对外暴露 http 服务和 RPC 服务，那么一个进程中就可以抽象为一个 `httpApplet` 和 `rpcApplet`。

看下进程模型的图就容易理解了 [cluster](cluster)

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
