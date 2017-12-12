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

## IDE 集成调试

IDE 集成调试暂时请通过 `pandora dev --inspect` 启动后，连接端口号的形式调试（比如 WebStorm 中的 Node.js Remote Debug）。

未来将会提供工具优化这一体验。