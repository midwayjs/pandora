
[![Build Status](https://travis-ci.org/midwayjs/pandora.svg?branch=develop)](https://travis-ci.org/midwayjs/pandora)
[![Test Coverage](https://img.shields.io/codecov/c/github/midwayjs/pandora.svg?style=flat-square)](https://codecov.io/gh/midwayjs/pandora)

## Installation

```bash
$ npm install pandora --save
```

Node.js >= 6.0.0 required.

## Features

- ✔︎ Built-in application model
- ✔︎ Built-in process management
- ✔︎ Dev Ops customization
- ✔︎ Support lots of web framework

## Documents

- 新手指南
    - [Pandora.js 是什么](intro/index.md)
    - [快速入门](intro/quickstart.md)
    - [基础命令使用](intro/command.md) 
    - [术语列表](intro/keyword.md) 
- 入门教程
    - [不同启动模式的区别](kinds_of_startup.md) 
    - [Fork 模式](fork_mode.md) 
    - [Cluster 模式](cluster_mode.md) 
    - [Procfile.js 模式](procfile_mode.md)
    - [调试应用](debug.md) 
    - [目录结构指南](dir.md)
- 进程管理进阶
    - [全局配置覆盖](process/global_config.md)
    - [基于 Procfile.js 编排应用](custom_procfile.md) 
        - [Environment 标准](environment_std.md) 
        - [Configurator 标准](configurator_std.md) 
        - [Applet 标准](applet_std.md) 
        - [Service 标准](service_std.md) 
    - [进程模型](process/process_model.md) 
    - [应用生命周期](process/applicationl_life_cycle.md) 
- 标准监控体系
    - [监控体系介绍](monitor/index.md) 
    - [使用和扩展 EndPoint](monitor/endpoint.md)
    - [使用和扩展 Metrics](monitor/metrics.md)
    - [内置的监控内容](monitor/monitor_inner.md)
- 二次开发
    - [基于 Pandora.js 开发框架](develop_framework_with_pandora.md) 
- 社区和开放
    - 支持的框架 
    - 支持的监控平台 
    - 如何贡献 

## API Reference

* [pandora](./api-reference/pandora/globals.html)
* [pandora-metrics](./api-reference/metrics/globals.html) 
* [pandora-env](./api-reference/env/globals.html)
* [pandora-service-logger](./api-reference/service-logger/globals.html)
* [pandora-messenger](./api-reference/messenger/globals.html)
* [pandora-dollar](./api-reference/dollar/globals.html)

## How to Contribute

Please let us know how can we help. Do check out [issues](https://github.com/midwayjs/pandora/issues) for bug reports or suggestions first.

To become a contributor, please follow our [contributing guide](CONTRIBUTING.md).

## License

[MIT](LICENSE)
