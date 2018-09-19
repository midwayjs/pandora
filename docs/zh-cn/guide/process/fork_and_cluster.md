# Fork 和 Cluster

Pandora.js 提供了 Fork 和 Cluster 用于方便对接存量应用，基本是对现有能力的封装，关系简述如下：

```javascript
module.exports = function (pandora) {
  
  /**
  * Fork 模式的内在机理
  */

  // fork ./app.js 并命名为 forkProcess
  pandora
    .fork('forkProcess', './app.js');
  
  // 等价于
  pandora
    // 新建一个进程定义
    .process('forkProcess')
    // 定义该进程的入口文件为 ./app.js
    .entry('./app.js');
    
    
  
  /**
  * Cluster 模式的内在机理
  */
  
  pandora
    .cluster('./app.js');
  
  // 等价于
  pandora
    .service('clusterX', class ClusterService {
      start() {
        require('./app.js');
      }
    })
    // 不指定默认也是 worker
    .process('worker');
  
}
```
