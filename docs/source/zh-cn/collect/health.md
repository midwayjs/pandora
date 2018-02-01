# 健康检查

Pandora.js 提供了 `HealthEndPoint` 来做健康检查的能力，通过 `/health` 的路由即可访问。

默认我们提供了一些基础的检查，比如磁盘检查，端口检查等，如果需要修改其中的配置，可以在全局配置中进行覆盖调整。

`HealthEndPoint` 有相应的客户端来负责采集数据， 我们提供了 `HealthIndicator` 这个基础抽象类，用户只要实现它就能把健康检查给统一起来。

比如你要检查当前的远程服务器是否可用，就可以实现其中的 `doCheck` 方法。

```javascript
import 'HealthIndicator, HealthBuilder' from 'dorapan';
import * as cp from 'child_process';

export class RemoteUrlHealthIndicator extends HealthIndicator {
  name = 'remote_url';

  doCheck(builder) {
    // check remote
    let result = cp.execSync(`curl -s --connect-timeout 1 -o /dev/null -w "%{http_code}" http://google.com`);
    if (result.toString() === '200') {
      builder.up();
    } else {
      builder.down();
    }
  }
}

```

在 `doCheck` 方法中，我们传入了一个 builder，用来简化返回结果，通过 `builder.up()` 和 `builder.down()` 来返回成功和失败。

这样，你访问 `http://127.1:8006/health` 的时候，就能看到名为 `remote_url` 的健康检查结果了。

大概如下：

```
{
  status: 'UP',
  remote_url: {
    status: 'UP'
  }
}

```

这里的格式是由 `HealthResource` 这个类定义的，健康检查看的是总体的一个结果，只要出现一个不正常，整体就不通过，所以 status 字段代表着总的一个状态，通过 'UP' 和 'DOWN' 来表示是否健康。