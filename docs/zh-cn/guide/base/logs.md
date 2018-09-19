# 日志管理

## 日志目录结构

基于应用的目录规范，我们约定了以下的目录结构。


结构如下：

loggDir 默认在 `~/logs` 目录，可以通过全局配置修改，参见下面的章节。

```js
- ${loggDir}
	- pandorajs
		- deamon.log // Pandora.js 守护进程的日志
		- metrics.log // 符合规范的 Mertics 日志
	- $appName
		- nodejs_stdout.log // 标准的 Stdout 记录
		- error.log // 应用自行定义的日志文件
	- $appName2 // 如果是 egg 应用
		- nodejs_stdout.log // 标准的 Stdout 记录
		- common-error.log
		- ... 
```


#### Node.js 标准输出

1. Pandora.js 会将 Stdout 写在 `${logsDir}/${appName}/nodejs_stdout.log`
2. 按照日期进行日志切割


## 日志相关的默认配置

日志的行为可以通过全局配置进行配置，具体是：

```javascript
{
  logger: {
    logsDir: join(homedir(), 'logs'), // 日志目录
    appLogger: { // 每个应用的日志配置，基本上就是 Stdout
      stdoutLevel: 'NONE', // 默认不输出到 Daemon 的 Stdout，请务必不要改变这一配置
      level: 'INFO' // 默认记录 Info 信息，比如应用启动停止，建议保持 INFO
    },
    isolatedServiceLogger: false // Service 的日志是否分散为单个日志文件，建议保持 false
  }
}
```

如何进行全局配置参见[全局配置章节](../base/global_config.html)。

## 日志等级

1. ALL - 全部等级
2. DEBUG - DEBUG 及其以下
3. INFO - INFO 及其以下
4. WARN - WARN 及其以下
5. ERROR - ERROR 及其以下
6. NONE - 全部不输出


## 创建自定义日志

可以通过 `require('dorapan').getService('logger').createLogger(name, config)`  创建，其中 config 定义如下：


```
{
  dir: string; // 日志所在目录
  stdoutLevel: string; // stdout 输出的等级，默认 ERROR
  level: string; // 文件输出等级，默认 WARN
  type: string; // 日志切割类型，可选 日期：date 、 尺寸：size，默认日期
  rotateDuration?: number; // 尺寸切割的检查周期，毫秒
  maxFiles?: number; // 尺寸切割时的最多文件数量
  maxFileSize?: number; // 尺寸切割时的文件大小
}
```
更详细参见 [LoggerService](http://www.midwayjs.org/pandora/api-reference/service-logger/classes/loggerservice.html)。

## 对接集中日志服务

请参与讨论：<https://github.com/midwayjs/pandora/issues/50>


## 日志自动清理

Pandora.js 暂不提供日志清理功能，但 Pandora.js 已经将日志按天切割（或尺寸）。可以针对 `~/logs` 配置一个简单 `crontab`，如[类似教程](https://www.cnblogs.com/peida/archive/2013/03/25/2980121.html)。

