title: Inter-Process Communication Hub
---

Pandora.js features in inter-process proxy which provides great convienence for inter-process access and communication.

## 

Example:

```javascript
const {getProxy, publishObject} = require('dorapan');

async function main() {

  // publish Math to IPC-Hub
  await publishObject('math', math);

  // Get object proxy
  const proxy = await getProxy('math');

  // invoke methods through await
  const val = await proxy.abs(-1234);
  console.log(val);
}

main().catch(console.error);
```

## Using IPC-Hub in service

Pandora.js offers the capability of publishing service to IPC-Hub.

`procfile.js`
```javascript
module.exports = function (pandora) {

  // define two processes
  pandora
    .process('a')
    .scale(1);
  pandora
    .process('b')
    .scale(1);

  // define two services(Service)
  // (These services are written in procfile.js, we normally don't recommend
  // service implementation in this way.)
  class ServiceA() {
    async getPid() {
      return process.pid;
    }
  }
  class ServiceB() {
    constructor(context) {
      this.context = context;
    }
    async start() {
      // or require('dorapan').getProxy()
      const serviceA = await this.context.getProxy('serviceA');
      const pid = await serviceA.getPid();
      console.log();
      console.log();
      console.log('pid from serviceA', pid);
      console.log('pid from self', process.pid);
      console.log();
      console.log();
      console.log();
    }
  }

  // define ServiceA in process a
  pandora
    .service('serviceA', ServiceA)
    .process('a')
    // publish serviceA to IPC-Hub
    .publish();

  // define serviceB in process b
  pandora
    .service('serviceB', ServiceB)
    .process('b');
};
```

## require IPC-Hub object

IPC-Hub offers other functionalities, just `require('dorapan').getHub()` and you're ready to go.

For specific details please refer to [Facade API](http://www.midwayjs.org/pandora/api-reference/hub/classes/facade.html) in `pandora-hub`.
