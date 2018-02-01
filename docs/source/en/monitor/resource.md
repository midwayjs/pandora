title: Expose RESTFul API
---

In the Pandora.js, we provided a batch of built-in EndPoints, the data of those EndPoints has exposed via HTTP. Each EndPoint can have a resource implementation to expose itself to outside via HTTP. The resource HTTP server has been created by `koa` and `koa-router`.


## Common behavior

All RESTFul resource APIs are packaged by a uniform data structure, the origin data is in the `data` field.

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

Each resource API can pass the `appName` parameter to access data for a specific application.


```javascript
GET /error?appName=yourAppName
GET /metris/list?appName=yourAppName
```



## List some common resources

The Pandora.js have some built-in EndPoints and Resources by default( see more about the default config file of the Pandora.js ). 

The data form the resource API could be not completely same with below, the data result will be changed depending on the current executing indicators.

> Notice: All results of the resources listed below has been removed the wrapper, to show only the part of the data field.

## DaemonResource

Expose some data of the daemon.

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

Expose some data of the InfoEndPoint, response some information such as appName.

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

Expose some data of the HealthEndPoint, just did some simple formatting.

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

Expose some data of the ErrorEndPoint, Provide a ability to access the application's errors.


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

Expose some data of the ProcessEndPoint.

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

Expose some data of the MetricsEndPoint.

Notice: The interfaces of the MetricsResource not only this one.


1. List all the metrics, this API will not filter the result, it will response all the indicator of all the metrics.

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

2. List a specific group of the metrics, such as the data of the `system` group, `/metrics/system`.

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

Expose some data of the TraceEndPoint.

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



## Custom RESTFul Resource


The Resource has some base type, show in below, only the `prefix` field and the `route` method is required.

```js
export interface ActuatorResource {
  prefix: string;
  route(routers);
}
```

Here is a simple implementation class, in the constructor method, accept an `endPointService` to get the `EndPoint` that was enabled. The interface can be exposed by the route method.


The `prefix` field is the prefix of the route, you must define the route prefix on each different resource to avoid conflict.


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

We provide a method for the `koa2` context `ctx` to quickly response the standard data structure, through the method `ok()` and the method `fail()` will easily to response your own result.


The standard data structure show in below: 

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


There also need to load those implementations into the configuration of the Pandora.js, the specific format show in below:

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

Each Resource can only be placed at the corresponding endpoint level, at present the EndPoint and Resource are all corresponding. You cannot only create the Resource to expose a RESTFul API.
