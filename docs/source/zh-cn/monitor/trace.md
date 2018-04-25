title: 链路追踪及监控
---

### 目前支持的链路节点

下面提到的节点全部默认实现与开启。


|     节点      | 支持版本 | 解释 |
|--------------|----------|-----|
| http(s).createServer() | - | 所有的 HTTP(S) 服务器，包括用 koa、express 等创建的 |
| http(s).request() | - | 所有发出的 HTTP(S) 请求，包括通过 request、urllib 等库发出的 |
| npm: mongodb | >=2.2.x | 也包括依赖 mongodb 的 ORM 比如 mongoose |
| npm: mysql | ^2.x | 也包括其他依赖 mysql 的 ORM 比如 sequelize |
| npm: mysql2 | ^1.5 | - |
| npm: ioredis | ^3.x | - |

其他需求请在 GitHub 中创建 [Issue](https://github.com/midwayjs/pandora/issues)，我们会及时跟进。

### 如何查看链路

你可以通过 Restful 接口查看：

```javascript
curl http://127.0.0.1:7002/trace?appName=my-site # my-site 是您的应用名
```

也可以通过可视化 Dashboard 查看，[详情见文档](../other/dashboard.html)。


### 关于采样率

默认的采样率逻辑如下：

```javascript
{
  // 采样率
  rate: process.env.NODE_ENV !== 'production' ? 100 : 10,
  // 优先级高的链路是否跳出采样率限制，比如错误的链路
  priority: true 
}
```
生产环境（NODE_ENV 为 production 时采样率）为 10%，其他情况 100%。

这一设定可以通过全局配置修改，[详情见文档](../base/global_config.html)。


### 如何新增一个链路节点

通过获得单例 TraceManager 对象，可以实现对链路功能的全部接口访问。 

```javascript
const {traceManager} = require('dorapan');
```

可以通过 `getCurrentTracer()` 接口获得当前活跃的链路对象，通过：

```javascript
const tracer = traceManager.getCurrentTracer(); // 如果不在一个链路中，将会获得 undefined
const span = tracer.startSpan('custom_span');
span.finish();
```

更多请参考这两个对象的 API Reference：

* [TraceManager](http://www.midwayjs.org/pandora/api-reference/metrics/classes/tracemanager.html)
* [Tracer](http://www.midwayjs.org/pandora/api-reference/metrics/classes/tracer.html)
* Tracer 对象继承和实现自 [OpenTracer](https://github.com/opentracing/opentracing-javascript，请同样参考一下。

### 实现原理

待解释
