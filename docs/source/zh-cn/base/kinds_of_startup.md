# 不同启动模式的区别

为了适应各种类型的应用，Pandora.js 提供了三种不同的启动模式 `fork`、`cluster`、`procfile.js` 。

## Fork 模式

[了解详情 <入门教程 - Fork 模式> ](fork_mode.md)

最简单的应用启动方式，直接使用 `child_process` 的 `fork()` 启动应用。如果进程异常退出， Pandora.js 将自动重启该应用。

示例：

```bash
pandora start --mode fork app.js
```

<!--
应用场景：

* [Egg.js 应用使用 Pandora.js](egg_use_pandora)
-->

## Cluster 模式

[了解详情 <入门教程 - Cluster 模式> ](cluster_mode.md)

基于 Node.js 的 `cluster` 模块来启动应用，Pandora.js 提供异常退出重启、Cluster Reload 等功能。

默认启动 CPU 数量个的子进程：

```bash
pandora start --mode cluster app.js
```

当然你也可以改变这一数量：

```bash
pandora start --mode cluster --scale 10 app.js
```

<!--
应用场景：

* [KOA 应用使用 Pandora.js](koa_use_pandora.md)
-->

## Procfile.js 模式

[了解详情 <入门教程 - Procfile.js 模式> ](procfile_mode.md)

`procfile.js` 模式是 Pandora.js 的主推模式，用户可以基于 `procfile.js` 来编排应用，使用 Pandora.js 提供的各种强大功能。

```bash
pandora start --mode procfile.js ./
```

应用场景：

* [基于 procfile.js 编排应用](../custom_procfile.md)


## 三种模式的特性支持情况

\-|**Fork**|**Cluster**|**procfile.js**
-----|:-----:|:-----:|:-----:
主进程异常守护|√|√|√
Worker 进程异常守护|×|√|√
Cluster Reload |×|√|√
Mertics 服务|-|√|√
┗━ Mertics 体系|√|√|√
┗━ 默认注入的 Mertics 监控|×|√|√
日志服务|-|√|√
┗━ 日志切割服务|√|√|√
┗━ 规范的日志管理|×|√|√
基于 Procfile.js 的编排应用|×|×|√
┗━ Applet 机制|×|×|√
┗━ Service 机制|×|×|√
┗━ Configurator 机制|×|×|√
┗━ Environment 机制|×|×|√
