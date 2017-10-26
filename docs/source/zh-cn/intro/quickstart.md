# 快速上手

## 环境依赖

操作系统：支持 macOS，Linux
运行环境：建议选择 LTS 版本，最低要求 6.x

## 本节目标

了解 Pandora.js 最基础的 start, stop, dev, exit, list 命令


## 安装

Pandora.js 可以直接安装在应用程序中，也可以安装在全局。

```sh
npm i pandora -g  // 安装在全局
npm i pandora --save   // 安装在应用
```

## 通过应用本身脚本启停

这种情况下， pandora 会进入应用的整个开发流程，一般情况下，我们会将 pandora 命令写到 scripts 段落中。

```json
// package.json
{
  "script": {
    "dev": "pandora dev ./",
    "start": "pandora start ./",
    "stop": "pandora stop ./"
  }
}
```

这个时候，你可以通过 ``scripts` 本身的机制来运行，比如

```
npm run dev // 本地启动
npm run start // 线上启动
```


## 全局模式下启停应用

```sh
pandora start [--name xxx] <path>
```

比如当前在应用根目录，应用为 `helloApp`。

```sh
pandora start .
pandora start . --name helloApp
```

第一个命令会以目录最后一截作为应用名，这样，应用会默认以 cluster 模式来启动，并在后台运行。

如果希望在前台启动，可以使用 dev 命令。

```sh
pandora dev .
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
