title: Trace Each Requests
---

### Supported trace span list

All of the spands mentioned below are implemented and opened by default.


|     Span      | Version | Desc |
|--------------|----------|-----|
| http(s).createServer() | - | All HTTP(S) Server, it also includes npm: koa, npm: express and etc |
| http(s).request() | - | All HTTP(S) requests, it also includes npm: request, npm: urllib and etc |
| npm: mongodb | >=2.2.x | it also includes ORM Based on mongodb, such as mongoose |
| npm: mysql | ^2.x | it also includes ORM Based on mysql, such as sequelize |
| npm: mysql2 | ^1.5 | - |
| npm: ioredis | ^3.x | - |

Other requirements please [create a Issue on GitHub](https://github.com/midwayjs/pandora/issues). 

### How to view trace link 

You can view it via Restful API

```javascript
curl http://127.0.0.1:7002/trace?appName=my-site # my-site 是您的应用名
```

It can also be viewed through GUI Dashboard, [check docs](../other/dashboard.html).



### about sampling rate

Default sampling rate is:

```javascript
{
  rate: process.env.NODE_ENV === 'production' ? 100 : 10,
  // If the trace with the highest priority is out of the sample rate limit,
  // such as a wrong trace.
  priority: true 
}
```

Production environment is 10%, otherwise 100%.

That can be changed via global config, [docs](../base/global_config.html).


### How to add a new kind of spans

TODO

### Principle

TODO

