title: 自定义 Process
---

## 如何定义进程

定义 Process 操作主要依靠对象 ProcessRepresentationChainModifier，具体例子简述如下：

`procfile.js`

```javascript

module.exports = function (pandora) {
  
  // 如果该进程定义存在则对其修改，否则就是新建
  pandora('processName')

    // 重命名进程
    .name('renameIt')

    // 标识进程的横向缩放的数量，默认 1 ，取值为 数字或者 auto （自动为 CPU 数量）
    .scale(5)

    // 增加 Node.js 参数
    .argv(['--expose-gc'])
 
    // 该进程的环境变量
    .env({
      ENV_VAR: 'envValue'
    })

    // 进程启动顺序
    .order(1)

    // 标记该进程是纯 Fork 模式的
    .mode('fork')

    // Fork 模式的入口文件
    .entry('./app.js')

    // Drop（删除）该进程定义
    .drop()
}

```

## Scale 与进程的关系

1. 如果一个进程定义的 Scale 大于 1 ，则使用 ScalableMater 进行启动，即 Master / Worker 模式。
2. 如果一个进程定义的 Scale 为 1，直接启动。

如下图：

![img](https://img.alicdn.com/tfs/TB1gpxPhgvD8KJjy0FlXXagBFXa-1794-890.png)

***注意：1.1.x 版本所有 Scale 大于 1 的进程，公用一个 ScalableMater ，未来版本会进行改进（提供参数选择）***


