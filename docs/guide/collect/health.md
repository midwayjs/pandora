# Health Check

Pandora.js provide `HealthEndPoint` for health check, with path `/health`.

We provide basic checks by default, such as disk check, port check. If you need adjust them, please edit the global config.

We provide a client to collect data for `HealthEndPoint`, and interface `HealthIndicator`. You only need to do is implement the interface.

For example, if you need to check remote server, just implement the `doCheck` method.

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

The method `doCheck` hava a parameter `builder` to help you return result. Use `builder.up()` for success and `builder.down()` for failure.

Now, visit `http://127.1:8006/health` to get health check result named as `remote_url`.

```
{
  status: 'UP',
  remote_url: {
    status: 'UP'
  }
}

```

Result object is defined by class `HealthResource`. The result `status` is a summary，it result failure if any check fails('UP' for success, 'DOWN' for failure). 
