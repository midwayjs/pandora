# pandora 

阿里Node.js应用的服务容器。


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


## 现有应用如何使用 Pandora.js 

1. [Midway 应用使用 pandora](https://lark.alipay.com/midway/pandora/uwlthp)
2. [Egg 应用使用 pandora](https://lark.alipay.com/midway/pandora/pandora-egg)
3. [其他应用使用 pandora](https://lark.alipay.com/midway/pandora/pandora-other)


