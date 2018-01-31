title: Fork and Cluster
---

Pandora.js provides 2 modes for launching applications, fork mode and cluster mode. They work for different scenarios.

```javascript
module.exports = function (pandora) {

  /**
   * Fork mode
   */
  
  // fork ./app.js and name it as 'forkProcess'
  pandora
    .fork('forkProcess', './app.js');
  
  // behave the same as
  pandora
    // launch a new process
    .process('forkProcess')
    // specify './app.js' as the entry file 
    .entry('./app.js');
    
  
  /**
  * Cluster mode
  */
  
  pandora
    .cluster('./app.js');
  
  // behave the same as
  pandora
    .service('clusterX', class ClusterService {
      start() {
        require('./app.js');
      }
    })
    // 'worker' is the default process name.
    .process('worker');
  
}
```
