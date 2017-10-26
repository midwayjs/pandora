# 应用生命周期

基于 Pandora.js 的开发的应用有如下的生命周期阶段。

- 表示阶段
- 创建阶段
- 注入阶段
- 启动阶段
- 关闭阶段

## 表示阶段 - procfile.js

通过 Procfile 表示整个应用的关系，具体参考 procfile.js 一节。

## 创建阶段

在 Pandora.js 中，可以同时部署多个不同的 application，通过当前的目录，准备一些基础信息，包括但不限于环境准备，初始化资源加载器，初始化上下文等。

## 注入阶段

注入的方式包括：

1. 根据 PANDORA_CONFIG 全局变量中指定的基础配置包来默认注入。
2. 通过 procfile.js 的表示来进行注入。

可以注入的实体有：

1. 类 Environment：处理环境相关的问题，判断是否生产环境。
2. 类 Configurator：处理应用的配置信息。
3. 类 Service：基础的 Service，如日志服务、中间件等。
4. 类 Applet：包含了应用的实现。

## 启动阶段

创建 Pandora.js 上下文并启动，调用 Service、Applet 的 `start()` 方法，启动诸如 HTTP 服务等。

## 关闭阶段

通过调用 `stop()` 方法，将应用关闭，服务停止等。