title: 启动 TypeScript 项目
---

因为 Pandora.js 本身就是 TypeScript 写的，所以如何使用这个就没有必要讲了。这里主要讲讲，如果你的项目是 TypeScript 编写的，如何方便的使用 Pandora.js 开发。

`procfile.js`

```javascript
module.exports = (pandora) => {
  
  if(pandora.dev) {
    
    // 如果是 pandora dev 启动的话
    
    // 在 worker 定义中增加 -r ts-node/register
    pandora.process('worker').argv(['-r', 'ts-node/register', '--trace-warnings']);
    
    // 标识从源码目录启动
    pandora.service('dashboard', './src/Dashboard').process('worker');
    
  } else {
    
    // 如果是 pandora start 启动的话 （比如生产环境启动）
    
    // 标识从编译后的目录启动
    pandora.service('dashboard', './dist/Dashboard').process('worker');
    
  }
};
```

然后本地开发 `pandora dev` 就是从源码启动了， `pandora start` 就是从编译后的启动了。

Pandora.js 已经默认安装了对于 SourceMap 的支持，TypeScript 的错误堆栈可以很清晰的看到。
