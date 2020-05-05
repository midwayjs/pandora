# Pandora.js 2.0

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/midwayjs/pandora/blob/2.x/LICENSE)
[![GitHub tag](https://img.shields.io/github/tag/midwayjs/pandora.svg)]()
[![Build Status](https://travis-ci.org/midwayjs/pandora.svg?branch=2.x)](https://travis-ci.org/midwayjs/pandora)
[![Test Coverage](https://img.shields.io/codecov/c/github/midwayjs/pandora/2.x.svg)](https://codecov.io/gh/midwayjs/pandora/branch/2.x)
[![Package Quality](http://npm.packagequality.com/shield/pandora.svg)](http://packagequality.com/#?package=pandora)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Known Vulnerabilities](https://snyk.io/test/npm/pandora@2.x.x/badge.svg)](https://snyk.io/test/npm/pandora)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/pandora/pulls)

Node.js >= 8.2.1 required.


## 简介

Pandora.js 2.0 是一个 Node.js 应用的进程管理与监控工具，主要包括了几个部分：

### 一、进程管理及命令行工具

```bash
$ npm install -g pandora@release-2.x
```

可以通过 `pandora start` 启动应用，Pandora.js 会自动查找当前目录下的 procfile.js 的进程结构定义进行启动。与 Pandora.js 1.0 不同的是，Pandora.js 2.0 为了更好的适配现如今流行的进程容器模式，默认是前台启动的。如果希望后台启动请增加 `-d` 参数。

更多了解进程管理与命令行工具请参考[相关文档]()

### 二、CoreSDK 以及基础组件

进程启动器 pandora 集成了 pandora-core-sdk，pandora-core-sdk 默认内置了 Pandora.js 进行 Node.js 应用监控所需基础组件，包括：

| 组件 | 作用 |
| ------ | ------ |
| [actuatorServer](https://github.com/midwayjs/pandora/tree/2.x/packages/component-actuator-server) | 提供 Restful 的应用监控数据的获取，以及下行控制管道的接口 |
| [ipcHub](https://github.com/midwayjs/pandora/tree/2.x/packages/component-ipc-hub) | Pandora.js 进程间通信的基础 |
| [indicator](https://github.com/midwayjs/pandora/tree/2.x/packages/component-indicator) | 对于监控指标的注册管理，以及跨进程的监控数据查询 |
| [metrics](https://github.com/midwayjs/pandora/tree/2.x/packages/component-metrics) | 提供接口创建各类 Metrics ，供下游业务组件收集各类数据使用 |
| [trace](https://github.com/midwayjs/pandora/tree/2.x/packages/component-trace) | 收集 Trace 信息，提供 record() 接口供下游业务接口进行写入 |
| [errorLog](https://github.com/midwayjs/pandora/tree/2.x/packages/component-error-log) | 收集错误日志信息，提供 record() 接口供下游业务接口进行写入 |

### 三、其他默认集成的业务组件

| 组件 | 作用 |
| ------ | ------ |
| [httpServerMetrics](https://github.com/midwayjs/pandora/tree/2.x/packages/component-http-server-metrics) | 创建相应 Metrics ，收集 HTTP Server 的 QPS、RT 等 |
| [nodeMetrics](https://github.com/midwayjs/pandora/tree/2.x/packages/component-node-metrics) | 收集 Node.js 运行时的内存分布等信息 |
| [systemMetrics](https://github.com/midwayjs/pandora/tree/2.x/packages/component-system-metrics) | 收集操作系统内存、CPU Usage、Load 等 |
| [processInfo](https://github.com/midwayjs/pandora/tree/2.x/packages/component-process-info) | 收集进程的静态信息，如启动参数等 |
| [deadCounter](https://github.com/midwayjs/pandora/tree/2.x/packages/component-dead-counter) | 通过 IPC-HUB 的断线统计进程意外退出的次数 |
| [fileLoggerService](https://github.com/midwayjs/pandora/tree/2.x/packages/component-file-logger-service) | 带日志切割的 LoggerService，用于写入文本日志 |
| [sandboxFileReporter](https://github.com/midwayjs/pandora/tree/2.x/packages/component-sandbox-file-reporter) | 向 reporterManager 注册 metrics、trace、errorLog 三类 Reporter，通过 fileLoggerService 写入文本日志 |

### 四、AutoPaching

Pandora.js 2.0 亦提供 [pandora-component-auto-patching](https://github.com/midwayjs/pandora/tree/2.x/packages/component-auto-patching) 组件，通过通用的模块 Pachting、AyncHooks 等技术，自动向各类型的 Node.js 应用注入监控逻辑。自动获得 metrics、trace、errorLog 三类数据。

现在 pandora@2 已经默认集成该组件，开箱即可用。目前支持获取的数据包括：

基础：

| 功能 | 详细 |
| ------ | ------ |
| 错误日志 | console、promise 异常等皆可自动捕获 |
| HTTP Server QPS | 可以统计所有 HTTP Server 的 QPS、RT 等 |

链路相关：

|     节点      | 支持版本 | 解释 |
|--------------|----------|-----|
| http(s).createServer() | - | 所有的 HTTP(S) 服务器，包括用 koa、express 等创建的 |
| http(s).request() | - | 所有发出的 HTTP(S) 请求，包括通过 request、urllib 等库发出的 |
| npm: mongodb | >=2.2.x | 也包括依赖 mongodb 的 ORM 比如 mongoose |
| npm: mysql | ^2.x | 也包括其他依赖 mysql 的 ORM 比如 sequelize |
| npm: mysql2 | ^1.5 | - |
| npm: ioredis | ^3.x | - |


## Docs

* 中文文档 <http://www.midwayjs.org/pandora2/zh-cn/>
* English documents <http://www.midwayjs.org/pandora2/>

## How to Contribute

Please let us know how can we help. Do check out [issues](https://github.com/midwayjs/pandora/issues) for bug reports or suggestions first.

To become a contributor, please follow our [contributing guide](CONTRIBUTING.md).

## License

[MIT](LICENSE)

## Sponsor

<a target="_blank" href="http://opensource.alibaba.com/" ><img src="https://img.alicdn.com/tfs/TB14aTMbgmTBuNjy1XbXXaMrVXa-328-134.jpg" width="123" /></a>
