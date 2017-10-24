Pandora.js 提供了一些常用的命令行来帮助应用进行管理，比如：

- start
- stop
- restart
- list
- exit

## 前置：关于在淘系使用 Pandora.js 的若干

因为 Pandora.js 是开放软件，不集成任何与淘宝相关的环境处理、中间件等。如果用户需要在淘宝环境下使用 Pandora.js ，需要在 `package.json` 中增加如下：

```javascript
{
  "scripts": {
    "pandora": "PANDORA_CONFIG=@ali/pandora-taobao pandora"
  }
}
```

增加 pandora 的命令代理，主要是指定了使用 `PANDORA_CONFIG=@ali/pandora-taobao` 这一淘系默认配置。

**下文中所有提到 pandora 开头的 shell 命令需要使用 tnpm run pandora 代替，即如：**

```sh
pandora start .
```

替代为

```sh
tnpm run pandora start .
```

## start 启动应用

```sh
pandora start [--name xxx]<path>
```

最常用的启动命令，用于启动一个新的应用，这里的应用名为可选，默认为目录名。

举例：

```sh
// 当前目录为 /home/admin/mytaobao/target/mytaobao

pandora start . // 启动 mytaobao 应用，类似 --name=mytaobao
pandora start . --name mytaobao // 同上
pandora start `pwd` // 同上
```

## stop 停止应用

```sh
pandora stop <name>
```

停止一个应用，应用的信息保留。

举例：

```sh
pandora stop mytaobao // mytaobao 为之前定义的名字
```

## restart 重启应用

```sh
pandora restart <name>
```

重启一个应用，先停止运行，再按原配置启动。

举例：

```sh
pandora restart mytaobao // mytaobao 为之前定义的名字
```

## list 列出所有运行的应用

```sh
pandora list
```

列出应用列表，示例如下：
![b0df27982689aff7.png](https://private-alipayobjects.alipay.com/alipay-rmsdeploy-image/skylark/png/33200/b0df27982689aff7.png) 

## exit 退出 pandora

将 pandora 进程彻底退出，同时停止所有正在运行的应用

```sh
pandora exit
```
