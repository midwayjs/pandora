title: 使用和扩展 Metrics
---

Metrics 是监控里面比较大的一个体系，它基于 EndPoint 体系来传输数据，同时在这个基础上做了很多封装的工作。

Metrics 的原意是 **指标**，用于反馈应用的当前状况的数据值，所以 Metrics 最后的结果都是**数字**。

在业界标准的 Metrics 类型中，有几种标准的类型。

- Gauge 瞬时值
- Counter 计数器
- Meter 吞吐率度量器
- Histogram 直方分布度量器
- Timer 吞吐率和响应时间分布度量器

Pandora.js 目前对这几种度量器都做了一定的支持，这些度量器中最常用的就是 Gauge 和 Counter，可以说，80% 的场景都只是用这两种。

## 快速使用

我们在每个进程启动时创建了一个 `MetricsClient` 客户端，但是用户怎么在代码中拿到这个对象就成了一个问题，我们设计了一个代理类 `MetricsClientUtil` ，只要用户希望，就可以在任意地方获取到这个类，比如：

```javascript
import {MetricsClientUtil} from 'dorapan';
const client = MetricsClientUtil.getMetricsClient();
 
let counter = client.getCounter('test', 'test.qps.counter');
let histogram = client.getHistogram('test', 'test.qps.histogram');
let meter = client.getMeter('test', 'test.qps.meter');
let timer = client.getTimer('test', 'test.qps.timer');
 
counter.inc(1);
counter.dec(1);
histogram.update(5);
meter.mark(4);
timer.update(3, 1);
```

通过 `Client` 和 Get 对应的指标类型方法，这样在任意地方，用户都可以随时随地埋入 Metrics 指标，如果想知道埋入的效果，可以通过 `/metrics/:group` 这样的路由看到结果，更多的路由方法可以参考 [Reource](/monitor/resource.html)。

> 注意：所有的 Metric 实例，都必须注册到当前进程的 MetricsClient 上才能被采集到。

由于 Gauge 指标的特殊性，Client 无法通过类似的 getGauge 方法创建 Gauge 类型的指标，所以有了通用的 `register()` 方法，定义如下，也可以[查看 API](http://www.midwayjs.org/pandora/api-reference/metrics/classes/metricsclient.html#register)。

```javascript
client.register(group: string, name: MetricName | string, Metric);
```

根据定义，我们可以这样添加 Gauge 类型的指标。

```
client.register('test', name, {
  getValue() {
  	return 100;
  }
});
```



## 自定义指标

### Metric 基类

所有的指标都会继承一个叫 Metric 的基类，这个基类的作用是为了标识 Typescript 中的类型，没有很特别的作用。

通过这个基类，我们扩展出一些通用的指标接口用于继承，具体的在 [API 这里](http://www.midwayjs.org/pandora/api-reference/metrics/interfaces/metric.html)。

### MetricName

每一个指标都可以取一个名字，这个名字在 Pandora.js 并不是简单的字符串，而是一个 MetricName 类型的实现。

这个类的属性参见 [API 这里](http://www.midwayjs.org/pandora/api-reference/metrics/classes/metricname.html)。

常见的是 key 和 tags 两部分。

key 就是标准的字符串，一般由几个字符串通过 . 来拼接而成。而 tags 是一组对象 kv 对，key 加 tags 标识了唯一的一个 Metric。

### Gauge 瞬时值

Gauge 是一种实时数据的度量，反映的是瞬态的数据，不具有累加性。 具体的实现由具体定义来完成，比如当前的 load 值，或者当前的内存剩余值。

### Counter 计数器

Pandora.js 默认使用的计数器并不是普通的 Counter，而是分桶计数器。

每个计数器都会有两个方法，`inc` 和 `dec`，代表加和减操作。

分桶计数器会把每一次度量的结果分为不同的时间区间存储，例如，如果时间间隔是 5s 的话，那么会在 0， 5， 10，15……这几个点进行归档存储，这样就能拿到不同时间区间的计数。

分桶计数的 [API 在这里](http://www.midwayjs.org/pandora/api-reference/metrics/classes/bucketcounter.html)。

### Histogram 直方图

等待补充

### Meter 吞吐率

等待补充

### Timer

等待补充

