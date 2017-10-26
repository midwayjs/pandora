# 使用和扩展 Metrics

Metrics 原本属于 EndPoint 的一部分，但是因为比较特殊，所以这个 EndPoint 拿出来单独讲解，在整个体系里面，Metrics 是一个非常重要的部分。

EndPoint 和 Indicator 的数据交换，一般情况下，用户不太关心，一般是框架层需要处理的问题，而 Metrics 有一部分是需要用户自定义，自己埋入应用，这就需要单独来设计。

我们在每个进程启动时创建了一个 `MetricsClient` 客户端，但是用户怎么在代码中拿到这个对象就成了一个问题，我们设计了一个代理类 `MetricsManagerClient` ，只要用户希望，就可以在任意地方获取到这个类，比如：

```javascript
import {MetricsManagerClient} from 'pandora-metrics';
 
let counter = MetricsManagerClient.getCounter('test', 'test.qps.counter');
let histogram = MetricsManagerClient.getHistogram('test', 'test.qps.histogram');
let meter = MetricsManagerClient.getMeter('test', 'test.qps.meter');
let timer = MetricsManagerClient.getTimer('test', 'test.qps.timer');
let compass = MetricsManagerClient.getCompass('test', 'test.qps.compass');
 
counter.inc(1);
counter.dec(1);
histogram.update(5);
meter.mark(4);
timer.update(3, 1);
compass.update(4, 1);
```

这样在任意地方，用户都可以随时随地埋入 Metrics 指标。