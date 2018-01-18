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


## 度量类型

>  目前 Pandora.js 全部使用 typescript 来编写，有些代码必须带类型定义。
>
> 所有的 Metric 类型都继承与 [Metric 接口](http://www.midwayjs.org/pandora/api-reference/metrics/interfaces/metric.html)


### MetricName

每一个指标都可以取一个名字，这个名字在 Pandora.js 并不是简单的字符串，而是一个 MetricName 类型的实现。

这个类的属性参见 [API 这里](http://www.midwayjs.org/pandora/api-reference/metrics/classes/metricname.html)。

常见的是 key 和 tags 两部分。

key 就是标准的字符串，一般由几个字符串通过 . 来拼接而成。而 tags 是一组对象 kv 对，key 加 tags 标识了唯一的一个 Metric。


### 瞬态型度量

大部分的度量都从瞬态值 Gauge 介绍起，因为它最简单，最直观的表示数据的真实情况，也不涉及时间间隔的问题。

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

### 累加型度量

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



### 分布度量

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



### 变化速率度量

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

