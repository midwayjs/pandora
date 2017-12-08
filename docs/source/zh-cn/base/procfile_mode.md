title: 认识 procfile.js
---

`procfile.js` 是应用进程结构的描述文件，用户可以基于 `procfile.js` 来编排应用，使用 Pandora.js 提供的各种强大功能。
`procfile.js` 是一个普通的 js 文件，提供链式的语法定义应用。

## 应该把 procfile.js 放在哪里？ 

Pandora.js 会在下述两个位置查找 `procfile.js`。

* ./procfile.js
* ./node_modules/.bin/procfile.js （为了框架注入默认行为，为未来保留接口，暂无应用）

## 基本介绍

基本结构如下：

```javascript
// procfile.js 是一个标准的 Node.js 模块，必须导出一个 function ，第一个参数接受 pandora 对象用于定义
module.exports = function (pandora) { 
  pandora
    // fork 一个 Node.js 程序
    .fork('appName', './appName')
    // 增加一些 Node.js 参数
    .argv(['--expose-gc'])
    // 增加一些环境变量
    .env({
      NODE_ENV: 'production'
    });
};
```

`procfile.js` 为了方便使用有一些默认行为 （隐去无关紧要的内容）

```javascript

// 定义默认 Service 的分配进程为 worker 进程
pandora.defaultServiceCategory('worker');

// 定义上面说到的 worker 进程 
pandora.process('worker')
  // 进程进程的横向扩展，如果 dev 模式只启动 1 个，生产环境启动时启动 CPU 数量个
  .scale(pandora.dev ? 1 : 'auto')
  // 定义一个环境变量，淘宝内部的规范
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

## Fork 和 Cluster

```javascript
module.exports = function (pandora) {
  
  /**
  * Fork 模式的内在机理
  */

  // fork ./app.js 并命名为 forkProcess
  pandora
    .fork('forkProcess', './app.js');
  
  // 其等价于 
  pandora
    // 新建一个进程定义
    .process('forkProcess')
    // 定义该进程的入口文件为 ./app.js
    .entry('./app.js')
    // 标记该进程为 fork 模式，标记 fork 模式后将无法使用 service 等机制 （未来版本中会进行改进）
    .mode('fork');
    
    
  
  /**
  * Cluster 模式的内在机理
  */
  
  pandora
    .cluster('./app.js');
  
  // 等价于
  
  pandora
    .service('clusterX', class ClusterService {
      start() {
        require('./app.js');
      }
      stop() {
        // to do nothing
      }
    })
    // 不指定默认也是 worker
    .process('worker');
  
}
```

## 一个纯粹的例子
 
`procfile.js`
 
```javascript
module.exports = function (pandora) {
  pandora
    .service('httpServer', './httpServer').config(() => {
      return {
        port: 1338
      };
    });
};
```

`httpServer.js`

```javascript
const http = require('http');
module.exports = class HTTPServer {
  constructor(pandoraContext) {
    console.log(pandoraContext);
    this.config = pandoraContext.config;
  }
  // 标准的启动接口
  async start () {
    this.server = http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Simple');
    });
    await new Promise((resolve) => {
      this.server.listen(this.config.port, resolve);
    });
  }
  // 标准的停止接口，停止时会有 3 秒的时间窗口用于处理善后工作
  async stop () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
  }
};
```

那我们就可以使用如下命令启动

```bash
$ pandora start
Starting try at .../try
try started successfully!
```

然后我们就可以使用 `list` 命令查看启动结果

```bash
$ pandora list   
╔═════════╤═════════════╤═══════╤════════════════════════════════╤═════════╤══════════╤═══════════════════════╗
║ AppName │ Mode        │ PID   │ AppDir                         │ State   │ Uptime           │ Restart Count ║
╟─────────┼─────────────┼───────┼────────────────────────────────┼─────────┼──────────┼───────────────────────╢
║ try     │ procfile.js │ 97119 │ /Users/Allen/Works/midway6/try │ Running │ 2747.483 seconds │ 0             ║
╚═════════╧═════════════╧═══════╧════════════════════════════════╧═════════╧══════════╧═══════════════════════╝

```

或者前台启动

```bash
pandora dev
```


## 进阶功能

具体参考《进程管理进阶》章节的内容。

