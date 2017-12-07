# 快速上手

## 环境依赖

操作系统：支持 macOS，Linux
运行环境：建议选择 LTS 版本，最低要求 8.x 

## 本节目标

1. Pandora.js 最基础的 procfile.js 文件编写。

2. 了解 Pandora.js 最基础的 start, stop, dev, exit, list 命令


## 安装

Pandora.js 可以直接安装在应用程序中，也可以安装在全局。

```sh
npm i pandora -g  // 安装在全局
npm i pandora --save   // 安装在应用
```

## 生成 Procfile.js

Pandora.js 通过项目根目录下 `procfile.js` 定义应用进程结构，所以你需要在项目根目录下增加一个 `procfile.js`。
我们这章简单介绍最简单的 Fork 和 Cluster 方式，下面介绍的两种模式你只需要任选其一。

#### Fork 方式

Fork 方式是最简单的方式，只是简单拉起应用，类似于直接  `node app.js`。
为了方便新手入门，我们提供最简单的 Fork 方式的 `procfile.js` 的生成：

在项目根目录下：

```bash
pandora start app.js # app.js 是你的 Node.js 程序路径
```

然后你就会得到一个默认 `procfile.js` 你可以打开看一下，内容大致如下（隐去注释）：

```javascript
module.exports = (pandora) => {
  pandora
    .fork('appName', './app.js');
}
```

#### Cluster 方式

Cluster 方式是 Node.js Web Server 最常用的，我们默认会启动 CPU 数量的 Worker（不过你也该可以改变这一默认值）。

Cluster 方式的 `procfile.js`：

```javascript
module.exports = (pandora) => {

  pandora
    .cluster('./app.js'); // 默认启动到 worker 进程分组
 
  /* 自定义 Worker 数量
  pandora
    .process('worker')
    .scale(2); // 修改 worker 进程分组启动 2 个 worker ，默认是 CPU 数量 （取值为字符串 'auto'）
  */
    
}
```

## 通过应用本身脚本启停

这种情况下， pandora 会进入应用的整个开发流程，一般情况下，我们会将 pandora 命令写到 scripts 段落中。

```json
// package.json
{
  "script": {
    "dev": "pandora dev",
    "start": "pandora start",
    "stop": "pandora stop"
  }
}
```

这个时候，你可以通过 ``scripts` 本身的机制来运行，比如

```
npm run dev // 本地启动
npm run start // 线上启动
npm run stop // 线上停止
```

## 全局模式下启停应用

```sh
pandora start [--name xxx] [path]
```

比如当前在应用根目录，应用为 `helloApp`。

```sh
pandora start
pandora start --name helloApp
```

第一个命令会以 package.json 中的 name 或目录最后一截作为应用名，这样，应用会按照 procfile.js 的定义默默启动，并在后台运行。

如果希望在前台启动（仅本地调试），可以使用 dev 命令。

```sh
pandora dev
```

当应用启动之后，可以通过 list 命令查看。

```sh
pandora list
```

也可以将它停止运行。

```sh
pandora stop
```

> 因为 pandora 全局模式下一般在后台启动，所以最好是部署到服务器上才这么做。

一般情况下，使用过 start 命令启动应用之后，Daemon 进程依旧会常驻在内存中，这个时候就需要手动 exit，将 Daemon 进程正常退出，注意，使用 kill 指令不一定能够有效的杀死 Daemon 进程。

```sh
pandora exit
```
