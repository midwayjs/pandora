import { HubServer } from '../src/hub/HubServer';
import { HubClient } from '../src/hub/HubClient';

const testTimes = 10;
const expectTimes = 50000;
const expectConcurrency = 10;

async function init() {
  const hub = new HubServer();
  const clientA = new HubClient({
    location: {
      appName: 'testApp',
      processName: 'clientA',
      pid: '1',
    },
  });
  const clientB = new HubClient({
    location: {
      appName: 'testApp',
      processName: 'clientB',
      pid: '2',
    },
  });

  await hub.start();
  await clientA.start();
  await clientB.start();

  return { hub, clientA, clientB };
}

async function run(clientA): Promise<any> {
  let rtTotal = 0;

  return new Promise(resolve => {
    let times = 0;
    let completeTimes = 0;
    let concurrency = 0;

    for (let idx = 0; idx < expectConcurrency; idx++) {
      loop();
    }

    function loop() {
      if (concurrency >= expectConcurrency || times >= expectTimes) return;
      concurrency++;
      times++;
      const startTime = Date.now();
      clientA
        .invoke({ processName: 'clientB' }, 'echo', null)
        .then(() => {
          const endTime = Date.now();
          rtTotal += endTime - startTime;
          concurrency--;
          completeTimes++;
          if (completeTimes === expectTimes) {
            resolve(rtTotal);
          }
          loop();
        })
        .catch(err => {
          console.error(err);
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        });
    }
  });
}

async function main() {
  const { clientA, clientB, hub } = await init();

  for (let idx = 0; idx < testTimes; idx++) {
    console.log(`starting ${idx + 1} times benchmark`);
    const startTime = Date.now();
    const rtTotal = await run(clientA);
    const endTime = Date.now();
    const costMs = endTime - startTime;
    const tps = (expectTimes / costMs) * 1000;
    console.log(
      `cost: ${costMs}ms, tps: ${tps}, concurrency: ${expectConcurrency}, times: ${expectTimes} rt-average: ${rtTotal /
        expectTimes}ms rt-total: ${rtTotal}ms`
    );
  }

  await clientA.stop();
  await clientB.stop();
  await hub.stop();
  console.log('all done');
}

main().catch(console.error);
