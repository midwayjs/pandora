title: Base Monitoring
---


We have implemented some of the basic monitoring classes and also provide some of the basic functions, will also be gradually added, of course, if you implemented a public monitor module, we also welcome your contribution.


## EndPoint

### Base classes

| Class          | Description                   |
| :------------- | :---------------------------- |
| EndPoint       | Base Class of all the EndPoint, implemented the basic IPC channel |
| DuplexEndPoint | Basic duplex communication end, such as error collector has inherited this |


### Some implementation classes
| Class           | Description                       | Resource |
| :-------------- | :-------------------------------- | :------- |
| ErrorEndPoint   | Error log collector end, by intercept logger through the IPC forwarding mechanism | /error   |
| InfoEndPoint    | the basic information collector end, such as appName, package.json, working dir and so on | /info    |
| MetricsEndPoint | Metrics indicators collector end | /metrics |
| HealthEndPoint  | Health check collector end | /health  |
| ProcessEndPoint | Process information collector end  | /process |


## Indicator

### Base classes
| Class           | Description                            |
| :-------------- | :------------------------------------- |
| Indicator       | Base class of all the Indicator, implemented the basic IPC channel |
| DuplexIndicator | a duplex communication Indicator base class |
| HealthIndicator | Base class of health check. The default return behavior is standardized, because health checks only need to return to success or failure |

### Some implementation classes

| Class                    | Description    |
| :----------------------- | :------------- |
| DiskSpaceHealthIndicator | implemented the disk health check |
| PortHealthIndicator      | implemented the TCP port health check |
| BaseInfoIndicator        | implemented collector of the basic information |
| ConfigIndicator          | implemented collector of the runtime information |
| ErrorIndicator           | implemented collector of the application error |
| NodeIndicator            | implemented collector of the Node.js information |
| ProcessIndicator         | implemented collector of the process information |


## Reporter

### Base classes

A custom implementation can be inherited.


| Class                    | Description        |
| :----------------------- | :----------------- |
| ScheduledMetricsReporter | Base class for output the metrics, timing execution |
| CustomReporter           | Base class for output the custom monitoring |


### Built-in implementation classes

| Class                     | Description      |
| :------------------------ | :--------------- |
| ConsoleReporter           | Output Metrics to the command line |
| FileMetricManagerReporter | Output Metrics to the file |

## Metrics


We have implemented some basic MetricsSet, which has collected the basic Metrics of the application.


| Class                   | Description |
| :---------------------- | :---------- |
| V8GaugeSet.ts           | The indicator of the v8 |
| CpuUsageGaugeSet.ts     | CPU usage |
| DiskStatGaugeSet.ts     | DISK usage |
| NetTrafficGaugeSet.ts   | Net traffic monitoring |
| SystemLoadGaugeSet.ts   | System load |
| SystemMemoryGaugeSet.ts | Memory Monitoring |
| TcpGaugeSet.ts          | TCP data Monitoring |

