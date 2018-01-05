title: 自定义 Service
---


## 什么是 Service

Service 也是像 `process('x).entry('./y.js')` 一样，往进程里定义 Node.js 程序，不过更结构化，提供下面的基础能力：

1. 标准的 `async start()` 接口，用户可以异步的启动 Node.js 程序。
2. 标准的 `async stop()` 接口，用户可以优雅的下线 Node.js 程序（比如优雅下线 RPC 服务，从而避免出现服务闪断）。
3. 结构化的日志管理、配置能力。
4. 进程内的启动顺序（依赖关系）管理。

## 如何获取 Service

1. 一般用户可以通过 `require('dorapan').getService(serviceName)` 获得。
2. Service 构造器中传入的 ServiceContext 亦有此方法。

## 如何定义 Service

Process 在 procfile.js 中进行定义，依靠如下语法：

`procfile.js`

```javascript
module.exports = function (pandora) {
  pandora
    .service('serviceName', './service.js');
}
```

上面的 `pandora. service('serviceName', './service.js')` 表示定义一个名字叫 `serviceName` 的 Service，并定义该 Service 的实现在 `./service.js`。

第二个参数除了传递一个相对路境外，也可以直接传递一个实现类的引用。最终，该语句会返回一个对象 [ServiceRepresentationChainModifier](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicerepresentationchainmodifier.html)。

我们可以通过 [ServiceRepresentationChainModifier](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicerepresentationchainmodifier.html) 完善对这个 Service 的定义。


下面通过一个简单的例子介绍全部的定义能力：


`procfile.js`

```javascript
module.exports = function (pandora) {
  
  // 定义一个叫 serviceA 的 Service 
  // 第二个参数为具体实现，可以是一个地址，或者一个实现类的引用
  // 如果不传第二参数，则是对已经定义的进行修改
  pandora('serviceA', './ServiceA')

    // 重命名 Service
    // 不传参数则获取
    .name('renameIt')

    // 指定分配到的进程，默认是 worker。
    // 可以用 pandora.defaultServiceCategory('worker') 修改默认取值
    // 不传参数则获取
    .process('worker')

    // 向 Service 配置
    // 不传参数则获取
    .config({
      port: 5555
    })
 
    // 定义依赖，下面的意思是，serviceX 必须先与此 Service 启动
    // 不传参数则获取
    .dependency(['serviceX'])
    
    // 在 IPC-Hub 中发布该 Service，具体参考 《进程间通信》 章节
    // . publish(false) 为取消发布
    .publish()

    // Drop（删除）该 Service 定义
    .drop()
}
```

### serive().process(processName: string) 的取值

`service().process(processName: string)` 里面的 `processName` 可以有如下的取值：

1. 某个已经定义了的进程名。
2. 'weak-all'，所以已经激活了的进程（通过 entry 或者其他 Service），但自己不会激活任何进程。
2. 'all'，全部定义了的进程。（会激活全部定义的进程，包括内置的默认定义，不建议使用）


### 修改默认分配到 Process

使用上文提到的 `pandora.defaultServiceCategory()` 修改。

```javascript
module.exports = function(pandora) {
  pandora.defaultServiceCategory('processName');
}

```

## 如何实现一个 Service

每个 Service 都是一个 Class，这个 Class 需要实现 0 个必选接口，和 4 个可选接口。


**new (context: [ServiceContextAccessor](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicecontextaccessor.html))**

> 可选，构造器第一个参数为 ServiceContextAccessor 对象，该 Service 上下文对象，下面有介绍到。

**start(): Promise&lt;void&gt; | void**

> 可选，生命周期方法，启动服务。

**stop?(): Promise&lt;void&gt; | void**

> 可选，生命周期方法，停止服务。Pandora.js 在停止应用时给予 5 秒的时间窗口进行优雅退出。


#### 静态属性、方法约束为：

**dependencies: string[]**

> 可选，在类系统中，亦称之为 static 属性。定义某个 Service 的依赖。


## ServiceContextAccessor 提供的主要接口

这个上面有不少的属性和方法，具体参考 [ServiceContextAccessor](http://www.midwayjs.org/pandora/api-reference/pandora/classes/servicecontextaccessor.html) API。下面介绍几个常用的：

#### 主要的属性

**serviceName: string**

> Service 的名字。

**config: any**

> 针对 Service 的配置，可以在 `.service().config({ key: 'value' })` 中给定。

**dependencies: { [depName: string]: Service }**

> 所有依赖的 Service 实例。

**logger: ServiceLogger**

> Service 专有的日志对象，会记录日志文件至 `${logsDir}/${appName}/service.log` 。

### 如何单元测试

你可以直接 new 你的实现类编写单元测试。


