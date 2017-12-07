# 基于 procfile.js 编排应用

`procfile.js` 模式是 Pandora.js 主推的模式，用于静态地描述一个应用的结构，我们将这种行为称之为编排应用。

`procfile.js` 主要分为以下四个能力：

> * Inject Environment -> 对于环境处理类的注入
> * Inject Configurator  -> 对于应用全局配置处理类的注入
> * Inject Applet -> 对于主业务实现类的注入
> * Inject Service -> 对于通用组件类（如中间件）的注入

然后 Pandora.js 会根据上面四种要素，自动产生进程结构，进而启动应用。

## 把 Procfile.js 放在哪里？ 

Pandora.js 会在下述两个位置查找 procfile.js 。


应用的 procfile.js 直接放在项目根目录下即可。


> **./procfile.js**

还有另一个扫描位置为框架预留，这样我们可以将 `procfile.js` 内置在另一个 NPM 包里面，开发项目时不需要编写 `procfile.js`。

> **./node_modules/.bin/procfile.js**


## 基础接口

### 作为一个 Node.js 模块

一个简单的 procfile.js

```javascript
module.exports = function (pandora) {
  pandora.configurator('./configurator');
  pandora.applet('./applet').config((ctx) => {
    return ctx.config.http;
  });
};
```
`procfile.js` 是一个 Node.js 模块，必须导出一个 `function`。可以通过 `module.exports` （ES5） 或 `export default` (ES2017) 导出。
 
该 `function` 接受一个参数 `pandora: ProcfileReconcilerAccessor`，我们透过这个对象进行注入与访问。

下面列出 `ProcfileReconcilerAccessor` 的一些基础能力，详细能力具体参见类型信息 [ProcfileReconcilerAccessor](https://midwayjs.github.io/pandora/api-reference/pandora/classes/procfilereconcileraccessor.html)。


### **基础属性**

> * pandora.appName -> 获得当前应用的名称
> * pandora.appDir -> 获得当前应用的工作目录

### **environment()**

用于注入环境处理类，该类用于统一处理识别线上与线下、机房等环境问题。该类具有默认实现，基于环境变量 NODE_ENV 的默认实现。

简单示例如下：

```javascript
module.exports = function (pandora) {
  pandora.environment(ANewImplAboutEnvironment);
}
```
关于 Environment 的默认行为与如何实现，详细参见：[Environment 标准](environment_std.md)

### **configurator()**

用于注入配置处理类，该类用于统一处理应用全局性质配置。该类具有默认实现，基于 Environment 给定的当前环境，基于某目录（默认为 ./config 目录）加载全局配置。

简单示例如下：

```javascript
module.exports = function (pandora) {
  pandora.configurator(ANewImplAboutConfigurator);
}
```

关于 Configurator 的默认行为与如何实现，详细参见：[Configurator 标准](configurator_std.md)


### **applet()**

Applet 对象可以理解为应用的主程序，用于注入业务实现。Applet 应该实现 [Applet 接口](classes/Applet.html)。

一个简单的例子

`procfile.js`

```javascript
class HTTPServer {
  constructor(options) {
    this.config = options.config;
  }
  start () {
    require('http').createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('simple_fork');
    }).listen(this.config.port);
  }
  stop () {
    // Do something when stop
  }
}
module.exports = function (pandora) {
  pandora.applet(HTTPServer);
}
```

pandora.applet() 会返回一个类型为 [AppletRepresentationChainModifier](https://midwayjs.github.io/pandora/api-reference/pandora/classes/appletrepresentationchainmodifier.html) 对象，可以通过这个对象链式地配置注入的 Applet ，简单介绍如下：

```javascript
pandora.applet(HTTPServer)

 // 自定义 Applet 的名字，默认根据类名自动生成
.name('aCustomNameForThatApplet') 

// 配置 Applet，上述例子中通过构造参数 `options.config` 获得
// 第一种方式，直接配置一个对象字面量
.config({ 
  port: 1999
})
// 第二种方式，通过全局上下文（或全局配置）配置
.config((ctx) => {
  // ctx 对象的类型为 WorkerContextAccessor
  return {
    port: ctx.config.port
  };
})

// 配置该 Applet 的分类，现在支持 worker 和 background 两种
// 用于标识该 Applet 运行在哪个进程分组，默认为 worker
.category('worker')
```

关于 Applet 的实现，详细参见：[Applet 标准](applet_std.md)

### **service()**

Service 对象可以理解为通用服务（比如中间件），Service 应该实现 [Service 接口](classes/Service.html)。

一个简单的例子

```javascript
class CalculatorService {
  constructor() {
    this.math = Math;
  }
  abs(number) {
    // Pandora.js 自动注入的 Core 对象，类型为 ServiceCore
    const core = this.core;
    return this.math.abs(number).toString(core.config.radix);
  }
}

module.exports = function (pandora) {
  pandora.service(CalculatorService);
}
```

pandora.service() 会返回一个类型为 [ServiceRepresentationChainModifier](https://midwayjs.github.io/pandora/api-reference/pandora/classes/servicerepresentationchainmodifier.html) 对象，可以通过这个对象链式地配置注入的 Service ，简单介绍如下：

```javascript
pandora.service(CalculatorService)

 // 自定义 Service 的名字，默认根据类名自动生成
.name('aCustomNameForThatService') 

// 配置 Service，上述例子中通过 `core.config` 获得
// 第一种方式，直接配置一个对象字面量
.config({ 
  radix: 1999
})
// 第二种方式，通过全局上下文（或全局配置）配置
.config((ctx) => {
  // ctx 对象的类型为 WorkerContextAccessor
  return {
    radix: ctx.config.radix
  };
})

// 显示的表示一个 Service 依赖
.dependency('aDependencyName')

// 配置该 Service 的分类，现在支持 worker 和 background 两种
// 用于标识该 Service 运行在哪个进程分组，默认为 worker
.category('worker')
```

关于 Service 的实现，详细参见：[Service 标准](service_std.md)


## 进阶接口

### getProcess()

动态修改某一个进程组的默认配置，高级接口谨慎使用。

```javascript
const worker = pandora.getProcess('worker');
if(process.NODE_ENV === 'local') {
  worker.scale = 1;
}
```
