# Resource 资源



在 Pandora.js 中，我们提供了一批将内置的 EndPoint  汇聚的数据通过 Http 对外暴露的能力，每一个 EndPoint 都可以有配套的 Resource 资源对外输出，这里的数据格式是通过 `koa` 和 `koa-router` 来简单扩展的。

## 通用行为

所有的接口都是通过统一的结构进行封装，真正的数据都是在 `data` 字段中。

```javascript
{
	data: {
      // xxxx
	}
	timestamp: Date.now(),
	success: false,	// true or false
	message: 'some fail message'
}
```

每个接口都可以传递 `appName` 参数来访问特定应用自己的数据。

```javascript
GET /error?appName=yourAppName
GET /metris/list?appName=yourAppName
```



## 列举一些常见的 Resource

Pandora.js 中埋入了一些默认的 EndPoint 和Resource，具体可以参考 Pandora.js 的默认配置文件，这些 Resource 列举的数据并不一定完全一致，所有的 key 会根据应用当前执行的 Indicator 变化。

> 注意，下面所有列举的 Resource 都去除了外面的包装，只展示 data 字段的部分

## DaemonResource

暴露 Daemon 的一些数据。

```javascript
GET /daemon

[
  {
    "cwd": "xxx",
    "pid": 12321,
    "uptime": 232,
    "loadedGlobalConfigPaths": [
      "/xxx/xxx/xxx"
    ]
  }
]
```



### InfoResource

暴露 InfoEndPoint 的数据，返回应用名等信息。

```javascript
GET /info

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

### HealthResource

提供暴露 HealthEndPoint 的能力，简单做了一些格式化。

```javascript
GET /health

{
  "status": "DOWN",
  "disk_space": {
    "status": "UP"
  },
  "port": {
    "status": "DOWN"
  }
}
```



### ErrorResource

暴露 ErrorEndPoint 的数据，提供访问错误数据的能力。

```javascript
GET /error

[
  {
    "method": "error",
    "timestamp": 1346846400,
    "errType": "TypeError",
    "message": "Cannot read property 'name' of null",
    "stack": "2017-11-29 15:01:20   Error: read ECONNRESET",
    "traceId": "1231455",
    "path": "/xxx/xx.log"
  }
]
```



### ProcessResource

暴露 ProcessEndPoint 的数据。

```javascript
GET /process

[
  {
    "pid": "72795",
    "title": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
    "argv": [
      "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
      "/Users/harry/project/pandora.js/packages/cluster/dest/application/entry.js",
      "--entry",
      "/Users/harry/project/node/pandora-app/dest/entry/app.js"
    ],
    "execArgv": [],
    "execPath": "/Users/harry/.nvm/versions/node/v6.9.4/bin/node",
    "cpu": 4.6,
    "memory": 90796032,
    "uptime": 267.667
  } 
]

```



### MetricsResource

对外暴露 MetricsEndPoint 的数据，这里的接口不止一个。

1、列出所有的 metrics，该接口不会进行过滤，会把应用下的所有 metrics 指标罗列出来

```javascript
GET /metrics/list

[
  {
	"metric": "sys.cpu.nice",
	"timestamp": 1346846400,
    "value": 18,
    "type": "COUNTER",
    "level": "CRITICAL",
    "tags": {
   	  "host": "web01",
      "dc": "lga"
  	}
  },
  {
    //xxx
  }
]
```

2、列出特定分组的 metrics，比如列出 `system` 组下的数据，`/metrics/system`

```javascript
GET /metrics/:group

[
  {
	"metric": "sys.cpu.nice",
	"timestamp": 1346846400,
    "value": 18,
    "type": "COUNTER",
    "level": "CRITICAL",
    "tags": {
   	  "host": "web01",
      "dc": "lga"
  	}
  },
  {
    //xxx
  }
]
```



### TraceResource

暴露 TraceEndPoint 采集的数据。

```javascript
GET /trace

[
  {
    "timestamp": "1511977377963",
    "appName": "DEFAULT_APP",
    "traceId": "1e084d5515118598316151001dd73d",
    "duration": 139,
    "pid": "23131",
    "ip": "127.0.0.1",
    "spans": [
      {
        "name": "http",
        "startMs": 1511859831616,
        "duration": 138,
        "context": {
          "traceId": "1e084d5515118598316151001dd73d",
          "spanId": "6f0f2be0d9e9a9e9"
        },
        "references": [],
        "tags": {
          "http.method": {
            "value": "GET",
            "type": "string"
          },
          "http.url": {
            "value": "/",
            "type": "string"
          },
          "http.client": {
            "value": false,
            "type": "bool"
          },
          "rpc_type": {
            "value": 0,
            "type": "number"
          },
          "http.status_code": {
            "type": "number",
            "value": 200
          }
        },
        "logs": [],
      }
  }
]
```



## 自定义 Resource

Resource 基础类型定义如下，只需要提供 `prefix` 和 `route` 方法即可。

```js
export interface ActuatorResource {
  prefix: string;
  route(routers);
}
```

如下是一个简单的实现类，构造函数中接受一个 `endPointService` 用来获取启用的 `EndPoint` ，通过路由方法对外暴露接口即可。

`prefix` 是路由前缀，这里必须对每个不同的 Resource 定义路由前缀，以避免出错。

```javascript
export class ErrorResource implements ActuatorResource {

  prefix = '/error';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const errorEndPoint = this.endPointService.getEndPoint('error');

    router.get('/', async (ctx, next) => {
      try {
        ctx.ok(await errorEndPoint.invoke(ctx.query['appName']));
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });
  }
}

```

我们对 `koa2`  的上下文 `ctx` 提供了一个快捷返回结构的函数，通过 `ok()` 和 `fail()` 函数即可将最后的结果返回出去。

返回的格式基本如下

```javascript
{
	data: {
      // xxxx
	}
	timestamp: Date.now(),
	success: false,	// true or false
	message: 'some fail message'
}
```



除了在代码中定义之外，还需要在 Pandora.js 的配置中加载，具体格式如下。

```javascript
actuator: {
   
    endPoints: {
      info: {
        enabled: true,
        target: InfoEndPoint,
        resource: InfoResource,
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
        resource: ProcessResource,
      },
    },
  },

```

每个 Resource 只能放到相应的 EndPoint 层级下，目前 EndPoint 和 Resource 是一一对应的，你无法单独创建 Resource 暴露接口。