# Cluster 模式

Cluster 模式可以理解为 Node.js 的 `cluster` 模块提供的能力，将默认启动 CPU 个数个子进程。

Pandora.js 内部是将其适配为一个默认的 `procfile.js` 模式的，所以其具有大部分的特性。

该模式特别适合于快速兼容，诸如 `KOA`、`Express` 等应用。

## 简单的例子

我们有一个应用 `koa.js`

```javascript
const Koa = require('koa');
const app = new Koa();
app.use(function * () {
  ctx.body = 'Hello World';
});
app.listen(3000);
```

那我们就可以使用如下命令启动


```bash
$ pandora start --mode cluster koa.js 
Starting koa.js at ~/koa.js
koa.js started successfully!
```

然后我们就可以使用 `list` 命令查看启动结果

```bash
$ pandora list                       
╔═════════╤═════════╤═══════╤════════════════════════════╤═════════╗
║ AppName │ Mode    │ PID   │ AppDir                     │ State   ║
╟─────────┼─────────┼───────┼────────────────────────────┼─────────╢
║ koa.js  │ cluster │ 91520 │ /Users/Allen/Works/midway6 │ Running ║
╚═════════╧═════════╧═══════╧════════════════════════════╧═════════╝
```

这样我们就启动了 CPU 个数个进程，我们可以查看一下

```bash
$ pstree 91520
-+- 91520 Allen /usr/local/bin/node ...
 |--- 91521 Allen /usr/local/bin/node ...
 |--- 91522 Allen /usr/local/bin/node ...
 |--- 91523 Allen /usr/local/bin/node ...
 \--- 91524 Allen /usr/local/bin/node ...
```

如果想指定进程个数可以使用 `scale` 参数

```bash
$ pandora start --mode cluster --scale 10
Starting koa.js at ~/koa.js
koa.js started successfully!
```

查看一下

```bash
$ pstree 92195
-+- 92195 Allen /usr/local/bin/node ...
 |--- 92196 Allen /usr/local/bin/node ...
 |--- 92197 Allen /usr/local/bin/node ...
 |--- 92198 Allen /usr/local/bin/node ...
 |--- 92199 Allen /usr/local/bin/node ...
 |--- 92200 Allen /usr/local/bin/node ...
 |--- 92201 Allen /usr/local/bin/node ...
 |--- 92202 Allen /usr/local/bin/node ...
 |--- 92203 Allen /usr/local/bin/node ...
 |--- 92204 Allen /usr/local/bin/node ...
 \--- 92205 Allen /usr/local/bin/node ...
```

## 进阶功能

* [Cluster 模式使用 Metrics 体系](cluster_use_metrics)
* [Cluster 模式使用日志切割服务](cluster_use_logger)
