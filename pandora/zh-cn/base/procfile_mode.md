title: 认识 procfile.js
---

procfile.js 是一个普通的 js 文件，提供链式的语法定义应用。

procfile.js 是描述应用进程结构的文件，可以基于 procfile.js 来编排进程结构，使用 Pandora.js 提供的各种强大功能。

当然把进程交给 Pandora.js 管理，不只是帮你创建进程这么简单，更是：

> Pandora.js 会守护创建出来的进程。
> 
> 小到自动重启、切割日志文件、重启次数计数。
> 
> 大到 30 多项 Metrics 指标采集、自动的全链路 Trace 追踪、对接现有 APM （比如 Open-Falcon）等等。


## 应该把 procfile.js 放在哪里？ 

Pandora.js 会在下述位置查找 `procfile.js`。

* ${appDir}/procfile.js

<!--* ${appDir}/node_modules/.bin/procfile.js （为了框架注入默认行为，为未来保留接口，暂无应用）-->


## 启动一个简单的 Node.js 程序

下文中 `pandora` 对象的类型为 `ProcfileReconcilerAccessor`，你可以点击查看详细 API。

我们先看个例子：

`procfile.js`

```javascript
// procfile.js 是一个普通的 Node.js 模块，必须导出一个 function
// function(pandora) 的第一个参数是 pandora，这个对象用于定义我们的进程结构
module.exports = function(pandora) {

  pandora
  
    // 定义一个进程，名字叫 processA
    .process('processA')
	
    // 如果 scale 大于 1 ，将使用 Node.js 的 Cluster 模块自动产生进程组
    // 默认值即是 1
    .scale(1)
	
    // 定义进程环境变量，创建出来的进程中可以通过 process.env 获得
    .env({
      ENV_VAR1: 'VALUE_OF_ENV_VAR1'
    })
	
	// 这个进程的入口文件地址
	.entry('./app.js');
    
}
```

`app.js`

```javascript
console.log(`Got the value of ENV_VAR1: ${process.env. ENV_VAR1} from Process [pid = ${process.pid}]`);
```

然后我们运行命令：

```bash
$ pandora dev # 通过 pandora dev 前台启动应用，多用于本地调试
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19766]
2017-12-11 13:59:12,578 INFO 19530 Process [name = processA, pid = 19766] Started successfully!
** Application start successful. **
```

## 基于 Scale 自动缩放进程

尝试把上面例子中的 `.scale(1)` 改为 `.scale(4)`，然后前台启动：

```bash
$ pandora dev # 通过 pandora dev 前台启动应用，多用于本地调试
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19913]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19915]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19916]
Got the value of ENV_VAR1: VALUE_OF_ENV_VAR1 from Process [pid = 19914]
2017-12-11 14:04:57,836 INFO 19910 Process [name = processA, pid = 19912] Started successfully!
** Application start successful. **
```

我们可以看到进程扩展到了 4 个，分别是 19913、19915、19916、19914。我们还可以看到 19912 ，这是四个进程的 Master 。

下图可能更容易理解：

![img](https://img.alicdn.com/tfs/TB1zC45hr_I8KJjy1XaXXbsxpXa-1768-916.png)

## 两个便捷的 Alias：Fork 和 Cluster

为了方便用户使用，我们提供了两个简便 Alias ，Cluster 和 Fork。一方面是为了简便使用。更是为了兼容存量的 Node.js 应用，让存量 Node.js 也可以很方便的使用。

**Fork**

pandora.fork() 是 process.process() 的一个 Alias。

`procfile.js`

```javascript
module.exports = function(pandora) {

  // 直接启动 ./app.js，等价于直接用 child_process.spawn 启动。
  pandora.fork('aForkedProcess', './app.js');

}
```

上面的例子等价于下面：

`procfile.js`

```javascript
module.exports = function(pandora) {

  pandora
  
    // 定义一个进程 aForkedApp
    .process('aForkedApp')
	
    // 指定只启动一个
    .scale(1)
	
    // 指定入口文件地址
    .entry('./app.js');

}
```

**Cluster**

pandora.cluster() 是 process.service() 的一个 Alias。

`procfile.js`

```javascript
module.exports = function(pandora) {

  // 用 Cluster 模块启动 app.js
  // 默认分配到 worker 进程
  // Pandora.js 内置了一个 process('worker').scale('auto') 的定义（ 'auto' 表示 CPU 数量 ）
  pandora.cluster('./app.js');

}
```

上面的例子等价于下面：

`procfile.js`

```javascript
module.exports = function(pandora) {
  
  // 定义 worker 进程，其实这个定义 Pandora.js 早已内置
  pandora
    .process('worker')
    .scale('auto');
  
  // 定义一个 Service，并分配到 worker 进程
  // 只做一件事情，引入 './app.js'
  pandora
    .service('scalableService', class ScalableService {
      start() {
        require('./app.js');
      }
    })
    .process('worker');

}
```


## Service 机制

上面讲到了 pandora.cluster() 是 process.service() 的一个 Alias，那 Service 是什么呢？

Service 也是往进程里定义 Node.js 程序，不过更结构化，提供下面的基础能力：

1. 标准的 `async start()` 接口，用户可以异步的启动 Node.js 程序。
2. 标准的 `async stop()` 接口，用户可以优雅的下线 Node.js 程序（比如优雅下线 RPC 服务，从而避免出现服务闪断）。
3. 结构化的日志管理、配置能力。
4. 进程内的启动顺序（依赖关系）管理。
 
下面是一个简单的例子：


`procfile.js`
 
```javascript
module.exports = function (pandora) {

  pandora
  
    // 定义一个 Service ，名字叫 httpServer，实现在 ./httpServer
    .service('httpServer', './httpServer')
    
    // 对其配置
    .config({
      port: 1338
    })
    
    // 分配到 worker 进程。这个其实不用写，默认就是分配到 worker 进程。
    // Pandora.js 内置一个 pandora.process('worker').scale('auto') 的定义。
    .process('worker');
    
};
```

`httpServer.js`

```javascript

const http = require('http');

module.exports = class HTTPServer {

  // 构造时会传递一个上下文对象
  constructor(serviceContext) {
    console.log(serviceContext);
    this.config = serviceContext.config;
    this.logger = serviceContext.logger;
  }
  
  // 标准的启动接口
  async start () {
  
    this.server = http.createServer((req, res) => {
      
      // 标准的日志对象，会记录在 ${logsDir}/${appName}/service.log
      this.logger.info('Got a request url: ' + req.url);

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello Pandora.js');
      
    });
    
    // 标准的启动接口，异步等待 Server 监听成功才算启动成功
    await new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (err) => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
    
    console.log('Listens on http://127.0.0.1:' + this.config.port);
    
  }
  // 标准的停止接口，停止时会有 5 秒的时间窗口用于处理善后工作
  async stop () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
    console.log('Service stopped');
  }
};
```

那我们就可以使用如下命令启动：

```bash
$ pandora dev
Listens on http://127.0.0.1:1338
2017-12-11 14:34:22,340 INFO 21481 Process [name = worker, pid = 21483] Started successfully!
** Application start successful. **
```

我们看到 `Listens on http://127.0.0.1:1338`，服务已经成功启动。

然后我们访问下 `http://127.0.0.1:1338`，然后查看 `${logsDir}/${appName}/service.log` 可以看到日志也已经写入了。

然后 `Ctrl + c` 停止应用，我们可以看到同样有 `Service stopped` 的输出。

## Pandora dev 与 Pandora start

1. Pandora dev 多用于本地调试，不启动 Daemon，并前台启动应用。
2. Pandora start 多用于生产环境启动，使用 Daemon 守护应用，后台启动应用。

procfile.js 中可以使用如下判断启动来源：

```javascript
if (pandora.dev) {
  // pandora dev 启动的
} else {
  // pandora start 启动的
}
```


## 内置的默认定义

`procfile.js` 为了方便使用有一些默认行为：

```javascript

// 定义默认 Service 的分配进程为 worker 进程
pandora.defaultServiceCategory('worker');

// 定义上面说到的 worker 进程 
pandora.process('worker')
  // 进程进程的横向扩展，如果 dev 模式只启动 1 个，生产环境启动时启动 CPU 数量个
  .scale(pandora.dev ? 1 : 'auto')
  // 定义一个环境变量
  .env({worker: 'true'});

// 定义一个后台任务进程
pandora.process('background')
  // 强制只启动 1 个
  .scale(1)
  .env({background: 'true'});

// 定义基础的 Logger Service
pandora.service('logger', LoggerService)
  /**
  * 进程不是定义了就会启动，比如有向其分配 Service 后才会启动
  * 比如 .process('worker') 表示向 worker 进程分配
  * 比如 .process('all') 表示向所有进程分配
  * 比如 .process('weak-all') 表示向所有激活进程（有其他 Service 在这个进程的）分配
  */
  .process('weak-all');

```
