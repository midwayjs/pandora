title: EndPoint usage and extension
----

EndPoint are pre-defined acceptors in Daemon for collecting each process'es Indicator data and group them by applications.

By default, Pandora.js provides a few EndPoint, all of them are open to user customization.

## Define EndPoint

Every EndPoint includes a name to tag its' uniqueness. And because EndPoint initialization was completed in Daemon, only one EndPoint instance exist according to the unique tag.

Each EndPoint is an IPC server, it accepts Indicator invocation results and summarises these data. Most commonly seen between theses methods are `invoke` and `processQueryResuts`, their definitions are as following:

```javascript
export interface IEndPoint {
  indicators: Array<IIndicator>;
  group: string;
  /**
   * invoke the following metrics
   * @param appName
   * @param args
   */
  invoke(appName: string, args?: any);

  /**
   * process responses
   */
  processQueryResults(results?: Array<IIndicatorResult>): any;
}
```

In the above code we used `interface` for definition and add `group` field for the EndPoint so that every Indicator has the same `group` could be be reported to the same EndPoint.

## Define Indicator

Each Indicator is an IPC client and initialized in different processes and sorted by pid. Generally speaking, one process only allow one Indicator which has the same name to exist. In cluster mode, Indicator can be used in various forms to report to EndPoint sharing the same group field name.

Indicator has a few important fields, kind of similar with EndPoint, `group` indicates the link to specific EndPoint while `invoke` method executes the real logics.

```javascript
/**
 * single metric
 */
export interface IIndicator {
  group: string;
  invoke(data?: any, builder?: IBuilder);
}
```

## Convention of Configuration

Configuration may differ between versions but most of it would be like this:

```javascript

export default {
  actuator: {
    endPoint: {
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          maxErrorCount: 100
        }
      },
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource
      }
    },
  },
  ...
};
```

Each EndPoint has a few common configurations:

- name {String} unique globally
- enabled {Boolean} enabled or not
- target {IEndPoint} corresponding EndPoint class
- resource {ActuatorResource} corresponding Resource class
- initConfig {Object} initialization configuration

```javascript
metrics: {
  enabled: true,
  target: MetricsEndPoint,
  resource: MetricsResource
}
```

Above is the code for EndPoint configuration.
