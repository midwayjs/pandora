# Fork 模式

Fork 模式是最简单的启动方式，也是特性支持最弱的启动方式。

只支持如下：

1. 主进程异常守护
2. Metrics 体系
3. 日志切割服务


## 简单的例子

我们有一个应用 `app.js`

```javascript
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('simple_fork');
}).listen(1338);
```

那我们就可以使用如下命令启动

```bash
$ pandora start --mode fork app.js
Starting app.js at ~/app.js
daemon started successfully.
app.js started successfully!
```

然后我们就可以使用 `list` 命令查看启动结果

```bash
$ pandora list                    
╔═════════╤══════╤═══════╤════════════════════════════╤═════════╗
║ AppName │ Mode │ PID   │ AppDir                     │ State   ║
╟─────────┼──────┼───────┼────────────────────────────┼─────────╢
║ app.js  │ fork │ 90680 │ /Users/Allen/Works/midway6 │ Running ║
╚═════════╧══════╧═══════╧════════════════════════════╧═════════╝
```

## 进阶功能

#### 自动注入 Monitoring （监控能力）

因为 Fork 模式下，次级进程的创建不受 Pandora.js 控制。
可以使用 `--inject-monitoring` 或 `-i` 向所有后辈的 Node.js 进程默认注入监控能力。

```bash
$ pandora start --mode fork --inject-monitoring app.js
```

#### Fork 模式使用 Metrics 体系

Coming soon...

#### Fork 模式使用日志切割服务

Coming soon...
