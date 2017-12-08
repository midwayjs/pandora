title: 自定义 Service
---


定义 Process 操作主要依靠对象 ServiceRepresentationChainModifier，具体例子简述如下：

`procfile.js`

```javascript
module.exports = function (pandora) {
  
  // 定义一个 ServiceA ，第二个参数为具体实现的地址。
  // 如果不传第二参数，则是对已经定义的进行修改
  pandora('serviceA', './ServiceA')

    // 重命名进程
    .name('renameIt')

    // 指定分配到的进程，默认是 worker。
    // 可以用 pandora.defaultServiceCategory('worker') 修改默认取值
    .process('worker')

    // 向 Service 配置
    .config({
      port: 5555
    })
 
    // 增加依赖
    .dependency(['x'])
    
    // 在 IPC-Hub 中发布该 Service，任何进程都可以获得这个 Service 的代理
    .publish()

    // Drop（删除）该 Service 定义
    .drop()
}
```

## 如何定义 Service

## Service 规范

Service 我们的定义为 —— 响应标准启动、停止的服务实现。

具体为：

1. 比如很多基础的中间件 SDK 的初始化、停止。
2. 应用主程序的启动、停止。
3. 可以跨进程间调用的服务，创建标准对象代理。

## Service 需要实现如下 Interface：

**new (context: ServiceContextAccessor)**

> 构造器第一个参数为 ServiceContextAccessor 对象，该 Service 上下文对象

**start(): Promise&lt;void&gt; | void**

> 生命周期方法，启动服务。

**stop?(): Promise&lt;void&gt; | void**

> 生命周期方法，停止服务。Pandora.js 在停止应用时给予 3 秒的时间窗口进行优雅退出。


#### 静态属性、方法约束为：

**dependencies: string[]**

> 在类系统中，亦称之为 static 属性。定义某个 Service 的依赖。


## ServiceContextAccessor 提供的主要接口

#### 主要的属性

**serviceName: string**

> Service 的名字。

**config: any**

> 针对 Service 的配置，可以在 `procfile.js` 中给定。

**dependencies: { [depName: string]: Service }**

> 所有依赖的 Service 实例。

**logger: ServiceLogger**

> Service 专有的日志对象，会记录日志文件至 `${appLogDir}/service.log` 。

### 如何测试

我们为 Service 提供一个单元测试类 DebugServiceReconciler，供单元测试中测试 Service 之使用。可以通过 `import {DebugServiceReconciler} from 'pandora'` 获得该类。

