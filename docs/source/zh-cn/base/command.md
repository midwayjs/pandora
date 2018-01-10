title: 命令行介绍
---

Pandora.js 提供了一些常用的命令行，比如：

- init
- start
- stop
- restart
- list
- log
- ps
- exit
- dev

## 初始化一个 Pandora.js 项目

```bash
pandora init <filePath> --name customName
```


快速生成 `procfile.js`。

1. `<filePath>` 必选，快速生成的入口文件。
2. `--name` 可选，fork 模式的进程名。

举例：

```bash
$ pandora init ./app.js
? Which type do you like to generate ? (Use arrow keys)
❯ fork 
  cluster 
** The procfile.js was auto generated to location /xx/xx/procfile.js **
```
## start 启动应用

```bash
pandora start [path] --name urAppName --env="NODE_ENV=production" --node-args="--expose-gc"
```

最常用的启动命令，用于启动一个新的应用。

1. `[path]` 可选，启动的目标路径，默认为当前目录。
2. `--name=urAppName` 可选，用于指定应用名，默认为当前目录中 package.json 的 name ，或当前目录名。
3. `--env="NODE_ENV=production"` 可选，指定启动应用的环境变量，应用可以通过 `process.env` 获得。
4. `--node-args="--expose-gc"` 可选，指定应用启动的 Node.js 参数。
4. `--args="--a=b"` 给应用程序的参数。

举例：

```bash
# 当前目录为 /home/admin/mytaobao/target/mytaobao （假设没有 package.json 中的 name）

pandora start # 启动 mytaobao 应用，类似 --name=mytaobao
pandora start . --name mytaobao # 同上
pandora start `pwd` # 同上
```

## stop 停止应用

> 注意：只有 start 命令启动的应用才可以 stop

```bash
pandora stop [appName]
```

停止一个应用。

1. `[appName]` 可选，用于指定应用名，默认为当前目录中 package.json 的 name ，或当前目录名。

举例：

```bash
pandora stop mytaobao # mytaobao 为之前定义的名字，如果没有指定 name ，和 start 一样自动获得 name
```

## restart 重启应用

```bash
pandora restart [appName]
```

重启一个应用，先停止运行，再按原配置启动。

1. `[appName]` 可选，用于指定应用名，默认为当前目录中 package.json 的 name ，或当前目录名。

举例：

```bash
pandora restart mytaobao // mytaobao 为之前定义的名字，如果没有指定 name ，和 start 一样自动获得 name
```

## list 列出所有运行的应用

> 注意：dev 命令不会启动 Daemon 进程，list 等命令无法查看到应用信息

```bash
pandora list
```

列出应用列表，示例如下：
![list](https://img.alicdn.com/tfs/TB107mPeOqAXuNjy1XdXXaYcVXa-2646-330.png) 


## log 查看日志

```bash
pandora log [appName] --follow --lines --full --daemon
```

1. `[appName]` 可选，用于指定应用名，默认为当前目录中 package.json 的 name ，或当前目录名。
2. `--follow` 可选，亦作 `-f`，类似 `tail -f`。
3. `--lines` 可选，亦作 `-l`，输出最后多少行，默认为 50 行。
4. `--full` 可选，输出全部日志。
5. `--daemon` 可选，输出 Daemon 的日志。

## ps 查看进程树

```bash
pandora ps <appName>
```

1. `<appName>` 必选，应用名。


## exit 退出 Pandora.js

将 pandora 进程彻底退出，同时停止所有正在运行的应用

```bash
pandora exit
```

## dev 前台启动应用

> 注意：dev 命令不会启动 Daemon 进程，list 等命令无法查看到应用信息

```bash
pandora dev [path] --name urAppName --env="NODE_ENV=production" --node-args="--expose-gc"
```

不启动 Daemon 直接前台启动应用，日志直接输出控制台。多用于本地调试，参数同 start。

1. `[path]` 可选，启动的目标路径，默认为当前目录。
2. `--name=urAppName` 可选，用于指定应用名，默认为当前目录中 package.json 的 name ，或当前目录名。
3. `--env="NODE_ENV=production"` 可选，指定启动应用的环境变量，应用可以通过 `process.env` 获得。
4. `--node-args="--expose-gc"` 可选，指定应用启动的 Node.js 参数。
4. `--args="--a=b"` 给应用程序的参数。


