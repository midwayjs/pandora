title: 自定义进程
---

## 如何定义进程

Process 在 procfile.js 中进行定义，依靠如下语法：

`procfile.js`

```javascript
module.exports = function (pandora) {
  pandora
    .process('processName');
}
```

上面的 `pandora.process('processName')` 表示定义一个名字叫 `processName` 进程，该语句会返回一个对象 `ProcessRepresentationChainModifier`。

我们可以通过 `ProcessRepresentationChainModifier` 完善对这个进程的定义。

下面通过一个简单的例子介绍全部的定义能力：

`procfile.js`

```javascript
module.exports = function (pandora) {
  
  // 如果该进程定义存在则对其修改，否则就是新建
  pandora('processName')

    // 重命名进程
    // 不传参数则获取
    .name('renameIt')

    // 标识进程的横向缩放的数量，默认 1 ，取值为数字或者 'auto'（自动为 CPU 数量）
    // 不传参数则获取
    .scale(5)

    // 设置 Node.js 参数，全覆盖
    // 如需增量请：.argv().push('--expose-gc')
    // 不传参数则获取
    .argv(['--expose-gc'])
 
    // 该进程的环境变量，全覆盖
    // 如需增量请：.env().x = 'y'
    // 不传参数则获取
    .env({
      ENV_VAR: 'envValue'
    })

    // 进程启动顺序
    // 不传参数则获取
    .order(1)

    // 这个进程的入口文件
    // 如果不设置，这个进程将不会启动（除非有 Service 被分配到了这个进程）
    // 不传参数则获取
    .entry('./app.js')

    // Drop（删除）该进程定义
    .drop()
}
```

### 没有程序入口进程不会启动

如果没有启动该进程的启动入口，该进程不会启动。

启动入口包括：

1. `.entry()` 的定义
2. 有 Service 分配到这个进程

## Scale 与进程的关系

1. 如果一个进程定义的 Scale 大于 1 ，则使用 ScalableMater 进行启动，即 Master / Worker 模式。
2. 如果一个进程定义的 Scale 为 1，直接启动。

如下图：

![img](https://img.alicdn.com/tfs/TB1gpxPhgvD8KJjy0FlXXagBFXa-1794-890.png)

