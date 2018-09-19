# 监控数据上报

## 默认的上报

目前内置的监控数据上报有两个方式，命令行输出和文件输出，大部分场景下是`文件输出`。

## 扩展上报

实现上报的基础接口是 `Reporter` ，包含 `start()` 和 `stop()` 方法。

所有的实现都是围绕这两个方法来展开的，我们基于 `Reporter` ，实现了一些可以继承的基类，大致继承关系如下。

![](https://img.alicdn.com/tfs/TB1sRFxigvD8KJjy0FlXXagBFXa-478-235.png)



- Reporter 基础接口，没有实现
- ScheduledMetricsReporter 针对 Metrics 的周期性采集的上报基类，只上报 Metrics
- ConsoleReporter 通过命令行输出 Metrics 的信息
- FileMetricsManagerReporter 通过写入文件的方式输出 Metrics 信息
- CustomReporter 自定义上报基类，可以上报所有东西，一般自定义的上报会继承这个类
- TraceReporter 上报链路信息




## 自定义



这里介绍 `CustomReporter` 的自定义，通过继承基类和实现 `report` 抽象方法，可以方便的进行自定义的数据上报。

```javascript
class MyReporter extends CustomReporter {

  metricsManager;
  endPointService;

  async report() {
  	// TODO execute report method where interval
  }
}
```



继承 `CustomReporter` 之后，会包含两个属性，`metricManager` 和 `endPointService`, 这两个属性包含了 Pandora.js 的绝大部分监控的功能。

MetricsManager 的接口见 [这里](http://www.midwayjs.org/pandora/api-reference/metrics/interfaces/metricsmanager.html)

endPointService 通过 `getEndPoint()` 方法可以获取不同的 EndPoint，再通过 EndPoint 返回不同的结果，EndPoint 的方法请参考不同的 EndPoint。
