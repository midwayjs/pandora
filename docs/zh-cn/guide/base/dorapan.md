# 用户空间 SDK - Dorapan

[Who is Dorapan](https://www.google.com/search?q=dorapan&tbm=isch)

因为 Pandora.js 可能是全局安装的，在用户项目中无法直接 `require('pandora')`，存在各种问题。推荐统一使用 `require('dorapan')` 来引用 Pandora.js 导出的运行时上下文信息、基础类等。

### 在用户目录下安装 dorapan

```bash
tnpm i dorapan --save
```

### require('dorapan') 等价于 require('pandora')

```javascript
console.log(require('dorapan') === require('pandora')); // true
```

### API

运行上下文信息请参见：

[Facade](http://www.midwayjs.org/pandora/api-reference/pandora/classes/facade.html)

可访问的基础类请参见：

[index.ts](https://github.com/midwayjs/pandora/blob/master/packages/pandora/src/index.ts)
