# pandora 

一个 Node.js 应用的服务容器。


## 安装

```bash
tnpm install pandora -g
```

全局安装 `pandora`，将会提供一个全局命令 `pandora` 。


##  pandora 命令详解


### pandora start

启动一个应用，默认使用项目路径的最后一段作为应用名。亦可通过 `--name giveAName` 。

```bash
pandora start ./pandora-project
```

### pandora stop

停止一个应用。

```bash
pandora stop pandora-project
```

### pandora list

查看所有的应用。

```bash
pandora list
```

