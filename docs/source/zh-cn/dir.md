# 目录结构指南

## 日志目录结构

基于应用的目录规范，我们约定了以下的目录结构。

结构如下：

```js
- /home/admin/logs	
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