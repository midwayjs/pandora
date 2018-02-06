title: Monitor Data Report
---

## Default Reporter

There ara two default reporter for monitor data. They are ConsoleReporter and FileMetricsManagerReporter.

## Extend Report

The base interface for monitor data report is `Reporter`, with `start()` and `stop()` method.

All reporter implemented `Reporter`. You can implement these class as below.

![](https://img.alicdn.com/tfs/TB1sRFxigvD8KJjy0FlXXagBFXa-478-235.png)

- Reporter  Base interface
- ScheduledMetricsReporter  Scheduled reporter for Metrics
- ConsoleReporter  Console reporter for Metrics
- FileMetricsManagerReporter  File reporter for Metrics
- CustomReporter  Custom reporter
- TraceReporter  Reporter for trace

## Custom Report

Here is definition for `CustomReporter`. You should implement the `report` method to report your custom data.

```javascript
class MyReporter extends CustomReporter {

  metricsManager;
  endPointService;

  async report() {
  	// TODO execute report method where interval
  }
}
```

The `CustomReporter` class has two property, `metricManager` and `endPointService`. They contain almost every Pandora.js monitor ability.

The `metricsManager` interface is [Here](http://www.midwayjs.org/pandora/api-reference/metrics/interfaces/metricsmanager.html)

The `endPointService` has `getEndPoint()` method, you can get your need with different EndPoint.
