# Metrics API

## Overview

扩展出一堆脱离环境和框架的监控指标，通过简单易用的方式暴露给外部使用方。

## 一些术语

**指标 - Indicator**

每个指标是某一特定领域下的值，是整个 Metrics 体系里的最小单位，具体表现为多个 k/v 対。

一般情况下指标都会埋入到不同的进程中，采集全方位的数据。

比如系统指标 `SystemIndicator`

```json
{
  "cpu": 0.21,
  "mem": 424
}
```

**数据端 - EndPoint**

可翻译为数据端，终端等，每一个 EndPoint 是一堆指标的聚合，它的展现形式可以自定义，一般为 JSON 格式，每个数据端包含了多个不同的指标集合。

`EndPoint` 通过一定的方式采集和收集 `Indicator` ，并且通过特定的数据格式展现，可以说是指标采集的大脑。

比如将一系列系统指标 `SystemIndicator` 和状态指标 `StatusCodeIndicator` 聚合后展现为 `SystemEndPoint`。

```json
// 具体格式以 EndPoint 处理之后的为准
{
  "system": {
    "cpu": 0.21,
    "mem": 424,
    "500": 5,
    "404": 0,
    ...
  }
}
```

## 全部的数据端

| 数据端 id | 实现类  | 描述 | 维度
----|----|----|----
list | [ListEndPoint](./src/endpoint/impl/ListEndPoint.ts) | 列出可用的数据端 | 全局
health | [HealthEndPoint](./src/endpoint/impl/HealthEndPoint.ts) | 健康检查 | 应用
node | [NodeEndPoint](src/endpoint/impl/EnvironmentEndPoint.ts) | 使用的 node 版本等具体数据 | 全局
error | [ErrorEndPoint](./src/endpoint/impl/ErrorEndPoint.ts) | 最近的应用错误内容 | 应用
process | [ProcessEndPoint](./src/endpoint/impl/ProcessEndPoint.ts) | 当前应用的进程信息 | 应用
system | [SystemEndPoint](./src/endpoint/impl/SystemEndPoint.ts) | 系统的一些状况，cpu 等 | 全局
info | [InfoEndPoint](./src/endpoint/impl/InfoEndPoint.ts) | 应用的一些静态数据，应用名，路径等 | 应用
runtime | [RuntimeEndPoint](./src/endpoint/impl/RuntimeEndPoint.ts)| 应用运行时的一些数据，配置等 | 应用
自定义 | [CustomEndPoint](./src/endpoint/impl/CustomEndPoint.ts) | 自定义的指标聚合 | 自定义


## EndPoint的内容

### ListEndPoint

返回当前可以用的数据段

```json
[
  "system",
  "info",
  "process",
  "error",
  "health",
  "custom",
  "list",
  "node",
  "env",
  "runtime"
]
```

### HealthEndPoint

返回健康指标

```json
{
  "status": true,
  "disk_space": true,
  "port":  true
}
```

### SystemEndPoint

展现系统指标

```json
{
  "system": {
    "uptime": 613031,
    "mem_total": 8589934592,
    "mem_free": 319959040,
    "load1": 2.41455078125,
    "load5": 3.89111328125,
    "load15": 3.576171875,
    "cpu": 0.1294416189247144,
    "disk_available": 21759172608,
    "disk_free": 22021316608,
    "disk_total": 249769230336,
    "code_2xx": 0,
    "code_3xx": 0,
    "code_4xx": 0,
    "code_5xx": 0,
    "code_2xxRa": 0,
    "code_3xxRa": 0,
    "code_4xxRa": 0,
    "code_5xxRa": 0,
    "pv": 0
  }
}
```


### ProcessEndPoint

列出特定应用存在的进行信息

```json
{
  "process": {
    "72795": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AgentMain.js",
        "--params",
        "{\"processName\":\"agent\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"agent\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AgentMain.js\",\"adapter\":false,\"scale\":1,\"argv\":[]}"
      ],
      "execArgv": [],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 4.6,
      "memory": 90796032,
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
      },
      "uptime": 267.667
    },
    "72803": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5859"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 2.6,
      "memory": 93769728,
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
      },
      "uptime": 265.096
    },
    "72804": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5860"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 0,
      "memory": 96673792,
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
      },
      "uptime": 265.038
    },
    "72805": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5861"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 19.1,
      "memory": 104861696,
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
      },
      "uptime": 265.079
    },
    "72806": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5862"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 12.3,
      "memory": 91820032,
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
      },
      "uptime": 265.036
    },
    "72807": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5863"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 11.4,
      "memory": 92962816,
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
      },
      "uptime": 265.059
    },
    "72808": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5864"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 10,
      "memory": 92508160,
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
      },
      "uptime": 265.032
    },
    "72809": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5865"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 6,
      "memory": 92114944,
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
      },
      "uptime": 265.057
    },
    "72810": {
      "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "argv": [
        "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
        "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
        "--entry",
        "/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js",
        "--params",
        "{\"processName\":\"app\",\"appDir\":\"/Users/harry/project/node/usersurvey\",\"name\":\"app\",\"main\":\"/Users/harry/project/node/usersurvey/node_modules/.0.1.7@@ali/pandora-midway/dest/entry/AppMain.js\",\"adapter\":false,\"argv\":[\"--max_old_space_size=300\",\"--debug\"]}"
      ],
      "execArgv": [
        "--max_old_space_size=300",
        "--debug=5866"
      ],
      "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "cpu": 0,
      "memory": 100036608,
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
      },
      "uptime": 265.082
    }
  }
}
```

## Metrics API 的使用

### CLI 部分

```
pandora metrics list
pandora metrics show [数据端id]
pandora metrics show [数据端id] <应用名>

e.g
pandora metrics show system
pandora metrics show info mytaobao
```

### RESTFUL API 部分

待定

## Reporter 接口

由于应用经常需要对接其他的 APM 平台，抽象了一个简单的 Reporter 接口用于上报数据，展现更为丰富的内容。

目前可用的 Reporter

- Sandbox-Reporter
