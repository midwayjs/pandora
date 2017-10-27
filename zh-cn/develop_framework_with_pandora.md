# 基于 Pandora.js 开发框架

对于 Pandora.js 来说一个框架就是一系列默认行为的集合，亦理解为一个默认的 `procfile.js`。具体来说就是，把 `procfile.js` 与其相关的各类实现放入一个单独的 NPM 包。

#### 框架暴露 procfile.js

Pandora.js 支持从 `./node_modules/.bin/procfile.js` 默认加载 `procfile.js`，对于框架 NPM 包来说需要在 `package.json` 中增加如下：

```
{
  "name": "a-framework-based-on-pandora",
  "bin": {
    "procfile.js": "./procfile.js"
  }
}
```

#### 用户同时安装 Pandora.js 和框架包

```
$ npm i pandora a-framework-based-on-pandora --save
```

此时通过 Pandora.js 启动该目录即默认使用了 `a-framework-based-on-pandora` 中的 `procfile.js`。

#### 一些注意

1. 上下文中的 appName 和 appDir 将为用户项目目录。
2. `process.cwd()` 将为用户项目目录。

框架可以根据上述两个信息，读取用户项目下的内容，进而启动应用。