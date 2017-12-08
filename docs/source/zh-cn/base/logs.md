title: 日志管理
---

## 日志目录结构

默认的日志目录为 `~/logs`，即用户目录下的 logs 子目录，该取值可以通过全局配置修改。

基于应用的目录规范，我们约定了以下的目录结构。

结构如下：

```js
- ~/logs	
	- pandorajs
		- deamon.log // Pandora.js 守护进程的日志
		- metrics.log // 符合规范的 Mertics 日志
	- $appName
		- error.log // 应用自行定义的日志文件
	- $appName2 // 如果是 egg 应用
		- nodejs_stdout.log
		- common-error.log
		- ... 
 ```
 

## Node.js Stdout

1. Pandora.js 会将 Stdout 写在 ~/logs/${appName}/nodejs_stdout.log 
2. 按照日期进行日志切割

## 日志自动清理

Pandora.js 暂不提供日志清理功能，但 Pandora.js 已经将日志按天切割。可以针对 `~/logs` 配置一个简单 `crontab`，如[类似教程](https://www.cnblogs.com/peida/archive/2013/03/25/2980121.html)。


## 对接集中日志服务

还在规划中
