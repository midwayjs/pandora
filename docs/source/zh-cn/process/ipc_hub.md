title: 进程间通信
---

Pandora.js 提供了一个进程间对象代理的功能，可以方便的实现跨进程访问、调用。

## 直接发布对象和获取对象代理

看下面的例子：

```javascript
const {getProxy, publishObject} = require('pandora');

async function main() {

  // 发布 Math 到 IPC-Hub
  await publishObject(Math, 'math');

  // 获得对象代理
  const proxy = await getProxy('math');

  // 所有方法直接 await 调用
  const val = await proxy.abs(-1234);
  console.log(val);

}
main().catch(console.error);
```

## Service 使用 IPC-Hub

Pandora.js 提供了进程间的对象代理功能，Service 可以便捷的发布到 IPC-Hub 中。

`procfile.js` 
```javascript
module.exports = function (pandora) {

  // 定义两个进程
  pandora
    .process('a')
    .scale(1);
  pandora
    .process('b')
    .scale(1);

  // 定义两个 Service 
  // （该例子 Service 实现全部写在 procfile.js 中了，这不是一个好的实践）
  class ServiceA {
    async getPid() {
      return process.pid;
    }
  }
  class ServiceB {
    constructor(context) {
      this.context = context;
    }
    async start() {
      // 或者 require('pandora').getProxy();
      const serviceA = await this.context.getProxy('serviceA');
      const pid = await serviceA.getPid();
      console.log();
      console.log();
      console.log('pid from serviceA', pid);
      console.log('pid from self', process.pid);
      console.log();
      console.log();
    }
  }

  // 定义 ServiceA 在 进程 a
  pandora
    .service('serviceA', ServiceA)
    .process('a')
    // 标识 serviceA 发布到 IPC-Hub 中
    .publish();

  // 定义 ServiceB 在进程 b
  pandora
    .service('serviceB', ServiceB)
    .process('b');

}
```

## 获得 IPC-Hub 整体对象

IPC-Hub 还有一些别的能力，可以通过 `require('pandora').getHub()` 获得。

具体参考 `pandora-hub` 包下的 [Facade 类的 API](https://midwayjs.github.io/pandora/api-reference/hub/classes/facade.html)。
