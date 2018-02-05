title: Metrics usage and extension
---

The Metrics is a big part of the whole monitoring system, which is based on EndPoint system to transport data, and simplified it to use.

the Metrics original design is refer to a indicator, that value has used to feedback the current status of the application. so the value of the Metrics all is a number.


In the industry, the Metrics have few standard types:

- Gauge - Transient value
- Counter - Counter
- Meter - Meter
- histogram - Histogram

the Pandora.js has currently made certain support for these metrics types, the most common used are the gauge type and the counter type, 80% of the situations are only used these two.


## Quick use

We set up a `MetricsClient` client at the start of each process, but how the user gets it this object has become a problem. We designed a proxy class called  `MetricsClientUtil`, you can get this class anywhere, for example: 


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
```


We can easily to embed a Metrics indicator in anywhere through get a corresponding metrics method. you can open `/metrics/:group` to see the result of that Metrics you just did. More route methods for reference [Reource](/monitor/resource.html).


> Notice: All metric instances, all must be registered to the MetricsClient in order to be collected.

Because of the specific nature of the Gauge indicator, The Client cannot be created like `getGauge`. In this case, you can out the `register()` method. The definition show in below, and you can also [see the API](http://www.midwayjs.org/pandora/api-reference/metrics/classes/metricsclient.html#register).

```javascript
client.register(group: string, name: MetricName | string, Metric);
```

By the design, we can add a Gauge type indicator like below:

```
client.register('test', name, {
  getValue() {
  	return 100;
  }
});
```

## The name of the indicator - MetricName

Each indicator can have a name, this name in the Pandora.js it not a simple string, but a MetricName type object.

[The reference the MetricName type](http://www.midwayjs.org/pandora/api-reference/metrics/classes/metricname.html)


The most common are the key and the tags.

The key is a normal string, joined by few strings with the separator dot(.),  and the tags is a K/V object.  the key and the tags identified a unique Metric.

And another part is the MetricsLevel, Different MetricsLevel corresponds to different indicator cache times, the default time is as follows, and the unit is seconds.


```javascript
  getCachedTimeForLevel(level: MetricLevel) {

    switch (level) {
      case MetricLevel.TRIVIAL:
        return 50;
      case MetricLevel.MINOR:
        return 20;
      case MetricLevel.NORMAL:
        return 10;
      case MetricLevel.MAJOR:
        return 2;
      case MetricLevel.CRITICAL:
        return 1;
      default:
        return 50;
    }
  }
```

That also means, if your MetricsLevel is `MetricLevel.MAJOR`, then the cache time is is seconds. If your acquisition interval is 1 second, then the value returned in both the acquisition windows is the same.


## The measure types

>  目前 Pandora.js 全部使用 typescript 来编写，有些代码必须带类型定义。
>
> 所有的 Metric 类型都继承与 [Metric 接口](http://www.midwayjs.org/pandora/api-reference/metrics/interfaces/metric.html)


### 瞬态型度量指标

大部分的度量指标都从瞬态值 Gauge 介绍起，因为它最简单，最直观的表示数据的真实情况，也不涉及时间间隔的问题。

Gauge 只包含一个 `getValue` 方法，只需要实现这个方法即可，比如，你想要知道当前进程的 cpu 使用情况，就可以一句话解决。

```javascript
<BaseGauge> {
  getValue() {
  	const startUsage = process.cpuUsage();
    return startUsage.user;
  }
}
```



> 注意，所有的 Metrics 最终输出的一定是数字形式，这样才可度量，如果你希望输出的是字符串类的信息，我们有另一套输出体系，这将在之后的文章介绍。

### 累加型度量指标

Counter 是第二个介绍的类型，计数器和 Gauge 不太一样，它是累加型，适用于记录调用总量等类型的数据，比如某个接口的调用次数。

如下图是计数器的继承接口和实现类。

![](https://img.alicdn.com/tfs/TB1OkX3ldrJ8KJjSspaXXXuKpXa-780-732.png)

除了基础的 `BaseCounter` 实现之外，我们提供了 `BucketCounter` 分桶计数器。

分桶计数的原理是定义一个时间间隔，将一段时间按照时间间隔分割为几个桶，每个桶保存当前时间间隔的计数。

比如时间间隔为 5s ，桶的总数为 10 个，那么 0~5s 为一个桶，5~10s 为下一个，以此类推。当计数的执行的时间为 2s 时，那么将在第一桶中累加，如果为 7s 时，那么将在第二个桶累加，非常容易理解。

在实际场景中，因为内存限制，不宜保存过多，桶的量会有限制，采用环形队列存储同时避免数据的挪动。



举个常用例子，记录 koa 服务的请求数。

```javascript
// 实际使用需要从 MetricsClient 拿到 BucketCounter
let counter = new BucketCounter();

app.use(async (ctx, next) => {
  // 累加 1 counter.inc(1);
  counter.inc();
  await next()
});
```



### 分布度量指标

第三个介绍的是 Histogram，直方分布指标，Pandora.js 包含一个基础实现类 `BaseHistogram`， 通过它可以用于统计某个接口的响应时间，可以展示 50%, 70%, 90% 的请求响应时间落在哪个区间内，通过这些你可以计算出 [Apdex](https://en.wikipedia.org/wiki/Apdex)。

> 这边的分布暂时只考虑单机分布，在集群维度上不能这样计算。

对于分布计算，核心就是维护一个数据集 [Reservoir](http://www.midwayjs.org/pandora/api-reference/metrics/enums/reservoirtype.html) ，数据集用来提供数据存储以及获取当前快照的能力。这其中最重要的就是数据更新的策略，目前 Pandora.js 只实现了随机采样（UniformReservoir）和 指数衰减随机采样（ExponentiallyDecayingReservoir）的实现，由于随机采样并不能很好的表现权重问题，默认的是指数衰减随机采样，其他的采样算法没有实现，有兴趣的同学可以补充。

举个常用例子，记录 koa 服务的成功比率，采用随机采样算法，间隔 1s，2个分桶，展示获取了平均数等信息。

```javascript
// 实际使用需要从 MetricsClient 拿到 BaseHistogram
let histogram = new BaseHistogram(ReservoirType.UNIFORM, 1, 2);

app.use(async (ctx, next) => {
  histogram.update(10);
  histogram.update(20);
  
  // other biz
});

// let snapshot = histogram.getSnapshot();
// expect(snapshot.getMean()).to.equal(15);
// expect(snapshot.getMax()).to.equal(20);
// expect(snapshot.getMin()).to.equal(10);
// expect(snapshot.getMedian()).to.equal(15);
```



### 变化速率度量指标

第四个介绍的是 Meter，是一种用于度量一段时间内吞吐率的计量器。例如，一分钟内，五分钟内，十五分钟内的qps指标。

这里要指出，变化的速率，我们一般情况下会关心两个地方，一个是瞬时爆发，超出平常正常值非常高的这样的波动变化，另一个是一段时间内的趋势，从平均的角度来看整体度量的一种方式，这种方式会将高低点进行平均来看。

前一种在  Metrics 中使用  Rate 的概念，只记录事件的累计总次数，有外部系统来通过前后两次采集，来计算瞬时速率，这里我们称之为`Rate`。

在rate的计算中，我们认为数据的增长是`线性`的。其计算方式为：rate = (v2 - v1) / (t2 - t1)，其中时间的单位是 s。

这样的好处是，通过调整采集频率，可以支持任意时间间隔的瞬时速率计算。但缺点是，当两次采样之间系统重启的时候，会计算出负数，同时会有一部分数据丢失。

后一种通过指数移动加权平均(Exponential Weighted Moving Average, EWMA）来计算。

针对速率型度量指标，我们提供了1分钟(m1)，5分钟(m5)，15分钟的EWMA(m15)，分别用于反映距离当前时间点1分钟，5分钟，15分钟的速率变化。

其具体的计算方法，和 Linux 系统中 load1, load5, load15 的计算方法完全一致。即，每 5 秒钟统计一次瞬时速率，并应用于如下的递推公式：

```
EWMA(t) = EWMA(t-1) + alpha * (instantRate - EWMA(t-1))
```

其中 alpha取值范围为 0~1, 称为衰减系数，该系数越大，则距离当前的时间点越老的数据权重衰减的越快。

举个常用例子，记录 koa 某个路由的调用比率。

```javascript
// 实际使用需要从 MetricsClient 拿到 BaseMeter
let meter = new BaseMeter();

router.get('/home', async (ctx) => {
  // 接口调用埋点
  meter.mark(1);
});

// meter.getMeanRate(); 总数除以时间
// meter.getOneMinuteRate(); // 一分钟的 EWMA
```

## 聚合型度量指标

这里引进一种特殊的指标，他相当于是多个指标的聚合。

```javascript
export abstract class MetricSet implements Metric {

  type: string = MetricType.METRICSET;

  /**
   * A map of metric names to metrics.
   *
   * @return the metrics
   */
  abstract getMetrics(): Array<{
    name,
    metric
  }>;
}
```

MetricSet 包含了一个抽象的 `getMetrics()` 方法，用于返回最终的多个 Metrics，我们利用它实现了一个上层 `CachedMetricSet`，用于将指标通过不同的 MetricsLevel 缓存一段时间。

这里举个简单的例子：

```javascript
class TestCachedMetricSet extends CachedMetricSet {

  caches;

  getValueInternal() {
    this.caches = {
      a: Math.random(),
      b: Math.random(),
    };
  }

  getMetrics() {
    let results = [];
    let self = this;

    results.push({
      name: MetricName.build('test.a'),
      metric: <BaseGauge<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.caches['a'];
        }
      }
    });

    results.push({
      name: MetricName.build('test.b'),
      metric: <GaugeProxy<any>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.caches['b'];
        }
      }
    });

    return results;
  }

}
```

这里通过 `getMetrics()` 方法返回了两个 Gauge 指标，这两个指标通过内部缓存的值进行返回， `refreshIfNecessary()` 用于将内部的缓存值进行刷新操作。 

内置的大部分指标像 CPU、内存等等都是基于 `CachedMetricSet` 来实现的，更多的可以参考[代码](http://www.midwayjs.org/pandora/api-reference/metrics/classes/cpuusagegaugeset.html)实现。

> 虽然注册时是一个指标，但是最后展示会进行分解，变成几个单独的指标
