title: Service 与 IPC-Hub（进程间通信）
---

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

  // 定义两个 Service （该例子 Service 实现全部写在 procfile.js 中了，这不是一个好的实践）
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

  // 定义 ServiceA 在 进程 a ，并且发布至 IPC-Hub
  pandora
    .service('serviceA', ServiceA)
    .process('a')
    .publish();

  // 定义 ServiceB 在进程 b
  pandora
    .service('serviceB', ServiceB)
    .process('b');

}
```

## 直接使用 IPC-Hub

获得 IPC-Hub

```javascript
const ipcHub = require('pandora').getHub();
```

使用 IPC-Hub

```javascript
const ipcHub = require('pandora').getHub();
async function main() {

  // 发布 Math 到 IPC-Hub
  await ipcHub.publish(Math, {
    name: 'math',
    tag: 'latest'
  });

  // 获得对象代理
  const proxy = await ipcHub.getProxy>({name: 'math', tag: 'latest'});

  // 所有方法直接 await 调用
  const val = await proxy.abs(-1234);
  console.log(val);

}
main().catch(console.error);
```
