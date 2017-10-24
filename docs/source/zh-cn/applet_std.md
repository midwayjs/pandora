# Applet 标准

Applet 对象可以理解为应用的主程序，用于注入业务实现。



## 主要接口

Applet 主要应该实现两个接口约束：

1. [Applet](interfaces/Applet.html) -> 对象的基础 Interface
2. [AppletConstructor](interfaces/AppletConstructor.html) -> 构造器约束

其中主要包括两个生命周期方法和一个构造器约束：

**start(): Promise<void>**

一个 async 异步方法，启动 Applet。

**stop(): Promise<void>**

一个 stop 异步方法，停止 Applet。

**new AppletConstructor(options: AppletOptions): Applet**

构造器约束中重点是 [AppletOptions](interfaces/AppletOptions.html)，包含了 Applet 需要的上下文、配置等对象，包括：

  * config -> 对该 Applet 的配置信息
  * context -> 进程级别的上下文访问器 [WorkerContextAccessor](calsses/WorkerContextAccessor.html)
  * appletName -> 该 Applet 名字
  * category -> 当前被分配的 category


## 建议使用的基础实现

Pandora.js 中内置了几种 Applet 的默认实现，若有需要推荐使用。

#### 抽象类 HTTPApplet

实现了 HTTP 类型业务的基础行为。

具体类型信息参见：[HTTPApplet](classes/httpapplet.html)

需要用户实现：

**abstract createServer(): http.Server**

创建 HTTP 服务器，要求返回类型为 Node.js 的 Server 类型。


**getPort (): number**

获取需要监听的端口，可以覆盖。默认行为为 `process.env.PORT || 6001`。


### BackgroundApplet

实现了后台任务类型业务的基础行为。

Coming soon...

