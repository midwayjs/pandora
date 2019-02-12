# Pandora.js 2.0 QuickStart

> 注：本文档中 Pandora 和 Pandora.js 都指代同一个东西，即本仓库代码所指代的工具包，包括但不限于衍生相关的系列产品和附属包。

Pandora.js 2.0 是一个 Node.js 应用的管理与监控工具，主要分为以下几部分：

1. CoreSDK 及基础组件：包括 TraceManger、ErrorLogManger、MetricsManger，提供链路、错误日志、Metrics 几种基础监控数据类型的收集管理；
2. 业务组件：比如收集 Node.js 内存指标的组件、收集操作系统指标的组件，这些组件向基础组件写入数据；
3. Reporter 组件：向基础的数据类型 Manger 订阅数据，写入文本日志或者写入远端日志存储等；
4. 前台启动器：提供 CLI，兼容 Pandora.js 1.0 的启动模式，通过 `procfile.js` 定义启动多组进程；


