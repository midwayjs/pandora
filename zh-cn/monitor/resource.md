# Resource 资源



在 Pandora.js 中，我们提供了一批将内置的 EndPoint  汇聚的数据通过 Http 对外暴露的能力，每一个 EndPoint 都可以有配套的 Resource 资源对外输出，这里的数据格式是通过 `koa` 和 `koa-router` 来简单扩展的。

## 列举一些常见的 Resource



### InfoResource

暴露 InfoEndPoint 的数据，返回应用名等信息。

```
GET /info

[
  {
    "appName": "xxx",
    "appDir": "xxxx",
    "node.v8": ""
  }
]
```





### ErrorResource

暴露 ErrorEndPoint 的数据，提供访问错误数据的能力。

```javascript
GET /error


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