title: 快速了解监控
---

如果使用了  `pandora start` 命令启动了应用（启动了 Daemon），则会自动启动监控路由，我们可以通过这些路由快速的了解应用内部的状态。

> 注意，dev 命令下没有启动 Daemon进程，没有这个功能

这些指标包括：

- 应用基础信息，cpu，load 等
- 应用的监控检查状态
- 应用的错误内容
- 进程信息
- 链路信息
- ...

以上只是简单列举一些，所有的监控都可以通过配置文件进行配置，也可以在代码级别进行扩展，具体可以参考自定义监控相关内容。

默认在应用启动后，会开启一个 `7002` 端口，通过一些路由展示数据。

比如展示应用信息。

```javascript
GET http://127.1:7002/info

RESPONSE

[
  {
    "appName": "xxx",
    "appDir": "xxxx",
    "node": {
      "node": "8.9.1",
      "alinode": "2.3.0",
      "versions": {
        "http_parser": "2.7.0",
        "node": "6.9.4",
        "v8": "5.1.281.89",
        "uv": "1.9.1",
        "zlib": "1.2.8",
        "ares": "1.10.1-DEV",
        "icu": "57.1",
        "modules": "48",
        "openssl": "1.0.2j"
      },
      "features": {
        "debug": false,
        "uv": true,
        "ipv6": true,
        "tls_npn": true,
        "tls_alpn": true,
        "tls_sni": true,
        "tls_ocsp": true,
        "tls": true
      }
    }
  }
]
```



类似的还有一些其他路由，都可以尝试一下，比如：

- /info
- /metrics/list
- /process
- /error
- /health

等等。

更详细的使用这些路由，请参考监控章节，包括自定义这些路由。
