Pandora.js 提供了一些常用的命令行来帮助应用进行管理，比如：

- start
- stop
- restart
- list
- exit

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
