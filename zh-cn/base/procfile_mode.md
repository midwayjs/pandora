# Procfile.js 模式

`procfile.js` 模式是 Pandora.js 的主推模式，用户可以基于 `procfile.js` 来编排应用，使用 Pandora.js 提供的各种强大功能。

本章只讲述基于 `procfile.js` 的应用如何启动，不讲述 `procfile.js` 的具体编写规范，相关参见 [&lt;基于 Procfile.js 编排应用&gt;](../custom_procfile.md) 。


## 应该把 procfile.js 放在哪里？ 

Pandora.js 会在下述两个位置查找 procfile.js 。

* ./procfile.js
* ./node_modules/.bin/procfile.js （为了框架注入默认行为）

## 简单的例子


我们有一个基于 `procfile.js` 的应用
 
 `procfile.js`
 
```javascript
module.exports = function (pandora) {
  pandora.configurator('./configurator');
  pandora.applet('./applet').config((ctx) => {
    return ctx.config.http;
  });
};
```

`applet.js`

```javascript
const http = require('http');
module.exports = class HTTPServer {
  constructor(options) {
    console.log(options);
    this.config = options.config;
  }
  start () {
    http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('simple_fork');
    }).listen(this.config.port);
  }
  stop () {
    // Do something when stop
  }
};
```

```configurator.js```

```javascript
module.exports = class MyConfigurator {
  getAllProperties () {
    return {
      http: {
        port: 1338
      }
    };
  }
}
```

那我们就可以使用如下命令启动

```bash
$ pandora start ./try/
Starting try at ~/try
try started successfully!
```


然后我们就可以使用 `list` 命令查看启动结果

```bash
$ pandora list   
╔═════════╤═════════════╤═══════╤════════════════════════════════╤═════════╗
║ AppName │ Mode        │ PID   │ AppDir                         │ State   ║
╟─────────┼─────────────┼───────┼────────────────────────────────┼─────────╢
║ try     │ procfile.js │ 97119 │ /Users/Allen/Works/midway6/try │ Running ║
╚═════════╧═════════════╧═══════╧════════════════════════════════╧═════════╝
```

## 进阶功能


* [基于 procfile.js 编排应用](../custom_procfile.md) 
* [基于 Pandora.js 开发框架](../develop_framework_with_pandora.md) 

