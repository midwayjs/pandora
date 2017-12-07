# 进程模型

Pandora.js 统一管理了应用的进行模型，将复杂的部分进行了隐藏和抽象。

受限于Node.js的并发模型以及V8在内存使用上的限制，Node.js需要使用多进程模式来充分利用系统资源提高并发性能。

另一方案，集团的许多中间件服务限制了长连接的数量，那么意味着，在使用多进程模式中，这些具有争抢性质的资源使用必须发生在一个进程中，并通过进程间通讯（IPC）的方式来使用这些资源。

Pandora.js 并不在 Cluster 这层解决资源争抢的问题，只提供基于agent、master、worker模型的Cluster 工具。

Pandora.js 把进程分为几个类型：

- 代表共享实例的 Agent 类型
- 代表业务体系的 Worker 类型
- 代表后台任务（如定时任务）的 background 类型

未来进程模型可能会进行扩充，目前只开放这三种基础类型。

不同进行模型中运行的实例称为 `Applet`，通过不同实现的 AppletLoader 来控制应用的启动逻辑。

进程结构层级如下图：

![f0e059db225dc923.png](https://private-alipayobjects.alipay.com/alipay-rmsdeploy-image/skylark/png/33200/f0e059db225dc923.png) 

每个 Application 都是通过 Deamon 进程来创建，通过 Procfile 的配置文件定义不同类型的进程模型，启动多个不同类型的 Applet。

其中当前 Agent 类型和 Background 类型的进行只会有一个，而 Worker 类型的进程可能会有多个。

每个 Appliation 中的进程都通过 IPC 来进行通信，进程通信模型如下图：

![65637dea4f731b52.png](https://private-alipayobjects.alipay.com/alipay-rmsdeploy-image/skylark/png/33200/65637dea4f731b52.png) 