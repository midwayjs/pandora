# Service 标准

Service 对象可以理解为抽象的通用的服务，比如中间件、日志服务等。提供了如下的能力：

1. 生命周期管理
2. Service 依赖关系
3. Cluster 模式下的跨进程单实例实现（ agent / worker 模型）
   1. 单实例的垮进程方法调用
   2. 单实例的垮进程事件监听
   
## 主要接口

Service 主要应该实现两个接口约束：

1. [Service](interfaces/service.html) -> 对象的基础 Interface
2. [ServiceConstructor](interfaces/ServiceConstructor.html) -> 构造器约束

#### 对象的基础 Interface 简述如下：

**core: ServiceCore**

公开的属性 `core`，用户不需要维护这个属性，Pandora.js 会自动注入。该对象封装了 Pandora.js 提供的全部能力，下面会详细讲到。

**start(): Promise<void> | void**

生命周期方法，启动服务。

**stop?(): Promise<void> | void**

生命周期方法，停止服务。

**handleSubscribe?(reg, fn): Promise<void> | void**

统一的订阅行为处理函数，主要用于`单实例的垮进程事件监听`。

**handleUnsubscribe**

统一的订阅行为处理函数，主要用于`单实例的垮进程事件监听`。

#### 构造器约束如下：

**dependencies: string[]**

在类系统中，亦称之为 static 属性。定义某个 Service 的依赖。

**getProxy(): Service**

在类系统中，亦称之为 static 方法。获得某个类的代理 Service，主要用于 `跨进程单实例实现`。

## 简单模式


## 跨进程单实例

## 如何断言测试

