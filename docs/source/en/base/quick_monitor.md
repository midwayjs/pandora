title: Quickly understand the monitoring
---

If the application was started using the `pandora start` command (Daemon started), the monitoring routes are automatically started and we can quickly get to know the internal state of the application via these routes.

> Notice, dev command does not start Daemon process, don't have this feature

These indicators include：

- Application of basic information, cpu, load and so on
- monitoring check status
- Error Logs
- Process information
- Tracing information
- ...

The above is only a few simple enumeration, all the monitoring can be configured through the configuration file and can also be extended in the code, the specific reference to custom monitoring related content.

After application startup, a `7002` port will be opened to show data by some routes in default situation.

For example, show application base information.

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


Similar to some other routing, you can try it, for example:

- /info
- /metrics/list
- /process
- /error
- /health

and so on。

For more details on using these routes, refer to the Monitoring chapter, including customizing these routes.
