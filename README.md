# Pandora.js

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/midwayjs/pandora/blob/2.x/LICENSE)
[![GitHub tag](https://img.shields.io/github/tag/midwayjs/pandora.svg)]()
[![Build Status](https://travis-ci.org/midwayjs/pandora.svg?branch=2.x)](https://travis-ci.org/midwayjs/pandora)
[![Test Coverage](https://img.shields.io/codecov/c/github/midwayjs/pandora/2.x.svg)](https://codecov.io/gh/midwayjs/pandora/branch/2.x)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/pandora/pulls)

Node.js >= 8.2.1 required.

⚠️: This project is still in a very early development stage.

⚠️: 当前项目还在早期开发阶段。

## 简介

Pandora.js 3.0 是采用了 [CNCF OpenTelemetry](https://opentelemetry.io/) 云原生观测体系的 Node.js 企业级应用探针。

### 二、CoreSDK 以及基础组件

进程启动器 pandora 集成了 pandora-core-sdk，pandora-core-sdk 默认内置了 Pandora.js 进行 Node.js 应用监控所需基础组件，包括：

| 组件 | 作用 |
| ------ | ------ |
| [actuatorServer](https://github.com/midwayjs/pandora/tree/2.x/packages/component-actuator-server) | 提供 Restful 的应用监控数据的获取，以及下行控制管道的接口 |
| [ipcHub](https://github.com/midwayjs/pandora/tree/2.x/packages/component-ipc-hub) | Pandora.js 进程间通信的基础 |
| [indicator](https://github.com/midwayjs/pandora/tree/2.x/packages/component-indicator) | 对于监控指标的注册管理，以及跨进程的监控数据查询 |
| [metrics](https://github.com/midwayjs/pandora/tree/2.x/packages/component-metric) | 提供接口创建各类 Metrics ，供下游业务组件收集各类数据使用 |
| [trace](https://github.com/midwayjs/pandora/tree/2.x/packages/component-trace) | 收集 Trace 信息，提供 record() 接口供下游业务接口进行写入 |
| [log](https://github.com/midwayjs/pandora/tree/2.x/packages/component-log) | 收集日志信息，提供 record() 接口供下游业务接口进行写入 |

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
