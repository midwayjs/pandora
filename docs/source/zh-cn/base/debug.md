## 在本地命令行启动项目

如果是全局安装的 Pandora.js ，如下命令即可（如有启动参数，与 start 命令相同）

> pandora dev ./

如果是项目内安装的：

> 增加（或修改） `package.json` 中 `script` 定义。对 `package.json` 做如下变更：

```
{
  "script": {
      "dev": "pandora dev ./",
  }
}
```

> 之后运行 `npm run dev` 即可本地启动应用。


## WebStorm （IntelliJ） 中调试项目

1. Working directory 设置为项目目录。
2. JavaScript file 设置为 `node_modules/.bin/pandora` 。
3. Application parameters 设置为 `dev ./` 。

下图为示例：

![e3b7f22a-de16-40a6-857d-647dc2063744.png](https://img.alicdn.com/tfs/TB1bnKNkaagSKJjy0FaXXb0dpXa-2352-1556.png) 

## 使用自带的 node-inspector 调试项目 （TODO）

对 `pandora dev` 增加 `--inspector` 参数即可

> pandora dev --inspector ./

***Notice: 该功能还未从公司内部体系剥离出来，待下个版本提供***

## Watch 项目，自动重启

对 `pandora dev` 增加 `--watch` 参数即可

> pandora dev --watch ./

***Notice: 该功能还未从公司内部体系剥离出来，待下个版本提供***
