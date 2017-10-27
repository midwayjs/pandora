# Service 标准

Service 对象可以理解为抽象泛化的通用服务，比如中间件、日志服务等。提供了如下的能力：

> 1. 生命周期管理
> 2. Service 依赖关系管理
> 3. Cluster 模式下的跨进程单实例实现（agent/worker 模型）
>    1. 单实例的跨进程方法调用
>    2. 单实例的跨进程事件监听
   
## 主要接口

Service 主要应该实现两个接口约束：

1. [Service](https://midwayjs.github.io/pandora/api-reference/pandora/interfaces/service.html) -> 对象的基础 Interface
2. [ServiceConstructor](https://midwayjs.github.io/pandora/api-reference/pandora/interfaces/serviceconstructor.html) -> 构造器约束

#### 对象的基础 Interface 简述如下：

**core: ServiceCore**

> 公开的属性 `core`，用户不需要维护这个属性，会自动注入。该对象封装了 Service 全部能力，下面会详细讲到。

**start(): Promise&lt;void&gt; | void**

> 生命周期方法，启动服务。

**stop?(): Promise&lt;void&gt; | void**

> 生命周期方法，停止服务。

**handleSubscribe?(reg, fn): Promise&lt;void&gt; | void**

> 统一的订阅行为处理函数，主要用于单实例的跨进程事件监听。

**handleUnsubscribe?(reg, fn?): Promise&lt;void&gt; | void**

> 统一的取消订阅行为处理函数，主要用于单实例的跨进程事件监听。

#### 构造器约束如下：

**dependencies: string[]**

> 在类系统中，亦称之为 static 属性。定义某个 Service 的依赖。

**getProxy(): Service**

> 在类系统中，亦称之为 static 方法。获得某个类的代理 Service，主要用于跨进程单实例实现。


## ServiceCore 提供的主要接口

`ServiceCore` 对于 `Service` 来说就是 `this.core` （自动注入），主要用于基本信息的访问、跨进程单实例实现。

#### 主要的属性

**serviceName: string**

> Service 的名字。

**config: any**

> 针对 Service 的配置，可以在 `procfile.js` 中给定。

**deps: { [depName: string]: Service }**

> 所有依赖的 Service 实例，比如 `this.core.deps.aDepService`。

**logger: ServiceLogger**

> Service 专有的日志对象，会记录日志文件至 `${appLogDir}/${serviceName}.log` 。

**context: WorkerContextAccessor**

> 进程级别的上下文对象。

**representation: ServiceRepresentation**

> Service 的静态表示对象。

**workMode: ServiceWorkMode**

> 当前 Service 工作模式。
> 取值范围：`ServiceWorkMode = 'agent' | 'worker' | null`


#### 主要的方法

**getDependency(name): Service**

> 获取指定名称依赖的 Service 实例。

**invoke(name: string, args?: any[]): Promise&lt;any&gt;**

> 调用 Service 的一个方法。
> 
> 1. 简单模式： 直接调用 Service 的某方法
> 2. 跨进程单实例模式：调用 AgentService 的某方法

**subscribe(reg, listener): Promise&lt;any&gt;**

> 向 Service 订阅一个事件。
>
> 1. 简单模式： 直接向 Service 的方法 handleSubscribe 进行订阅。
> 2. 跨进程单实例模式：向 AgentService 的方法 handleSubscribe 进行订阅。

**unsubscribe(reg, listener?): Promise&lt;any&gt;**

> 向 Service 取消订阅一个事件，如果 `listener` 不提供，将取消所有 `reg` 订阅（需要用户 handleSubscribe 中实现）。
> 
> 1. 简单模式： 直接向 Service 的方法 handleSubscribe 进行取消订阅。
> 2. 跨进程单实例模式：向 AgentService 的方法 handleSubscribe 进行取消订阅。

### 如何测试

我们为 Service 提供一个单元测试类 DebugServiceReconciler，供单元测试中测试 Service 之使用。可以通过 `import {DebugServiceReconciler} from 'pandora'` 获得该类。

#### 该类的主要接口

详细的接口参见： Class [DebugServiceReconciler](https://midwayjs.github.io/pandora/api-reference/pandora/classes/debugservicereconciler.html)

**new DebugServiceReconciler(workMode?: any): DebugServiceReconciler**

> workMode，取值 agent 或 worker，默认值 worker。

**receiveServiceRepresentation(rep: ServiceRepresentation): void**

> 接收（注册）一个 Service，通过 ServiceRepresentation 格式对象。ServiceRepresentation 的定义，具体参见：Interface [ServiceRepresentation](https://midwayjs.github.io/pandora/api-reference/pandora/interfaces/servicerepresentation.html) 

**start(): Promise&lt;void&gt;**

> 启动所有的 Service 。

**stop(): Promise&lt;void&gt;**

> 停止所有的 Service 。

**get &lt;T extends Service&gt; (name): T**

> 根据名称获取一个 Service 实例。


