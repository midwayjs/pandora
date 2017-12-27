title: 调试应用
---

## 在本地命令行启动项目

如果是全局安装的 Pandora.js ，如下命令即可（如有启动参数，与 start 命令相同）。

```bash
pandora dev
```

如果是项目内安装的：

> 增加（或修改） `package.json` 中 `script` 定义。对 `package.json` 做如下变更：

```
{
  "script": {
      "dev": "pandora dev",
  }
}
```

> 之后运行 `npm run dev` 即可本地启动应用。


## Inspector

执行如下命令

```bash
pandora dev --inspect
```

观察命令行输出，类似如下：

```bash
Debugger listening on ws://127.0.0.1:60587/a8217114-d61a-4789-8426-da350a88c1da
For help see https://nodejs.org/en/docs/inspector
```

使用 `node-inspect`、`Chrome DevTools` 等工具连接相关端口即可调试，这个例子中需要连接 `127.0.0.1:60587`。

## IDE：WebStorm（或其他 IntelliJ 的 IDE）中调试

**按照下图配置：**

![img](https://img.alicdn.com/tfs/TB1EY5.khTI8KJjSspiXXbM4FXa-2352-1556.png)

**重点：**

1. `Working directory`：填写项目根目录
2. `JavaScript file`：填写 pandora 的 bin 文件地址
  1. 如果是本地安装，为 `./node_modules/.bin/pandora`
  2. 如果是全局安装，可以通过在命令行中运行 `type pandora` 查看
3. `Application parameters`：填写为 `dev`

上面的配置等价于用 WebStorm 运行 `pandora dev`。

_注意：依赖于 WebStorm 的 [Node.js Multiprocess Debugging](https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html) 能力，太低版本的 WebStorm 可能存在问题，[相关 Issue](https://youtrack.jetbrains.com/issue/WEB-27312)。_



## 其它 IDE

如果其它 IDE 同样支持 Node.js Multiprocess Debugging 的话也可以使用，如果不支持请告诉我们。

其它 IDE 调试暂时请通过 `pandora dev --inspect` 启动后，连接端口号的形式调试（比如 WebStorm 中的 Node.js Remote Debug）。

为了让其它 IDE 也可以快捷地调试，我们正在做一个 Node.js 调试协议的代理。

