title: GUI Dashboard ( Pandora-Dashboard )
---


The pandora dashboard is a local dashboard (for single computer) , that is used to view and management the Pandora.js and the applications. The pandora dashboard also as a normal Pandora.js project, you can manage it like a normal Pandora.js project.

The project at the GitHub:

<https://github.com/midwayjs/pandora-dashboard>


## Usage

```bash
$ npm i pandora-dashboard -g # Install globally, that will install a global command  pandora-dashboard-dir
$ pandora start --name dashboard `pandora-dashboard-dir` # Use that command to get project dir, then use The pandora.js to start it .
```

Then, open `http://127.0.0.1:9081`, now we can see the dashboard.


![dashboard](https://img.alicdn.com/tfs/TB1pIfEeOqAXuNjy1XdXXaYcVXa-1906-1450.png)

## custom TCP port and IP address

By default, the dashboard listen on `http://127.0.0.1:9081`, you can also change it.
 
```bash
pandora start --name dashboard --env "DASHBORAD_PORT=9081 DASHBOARD_HOST=0.0.0.0" --npm pandora-dashboard
```

## Screenshots

![img](https://img.alicdn.com/tfs/TB1P44yh2DH8KJjy1XcXXcpdXXa-2536-1992.png)

![img](https://img.alicdn.com/tfs/TB1ZmRBh_vI8KJjSspjXXcgjXXa-2528-1998.png)

![img](https://img.alicdn.com/tfs/TB1k04KhY_I8KJjy1XaXXbsxpXa-2540-1996.png)

![img](https://img.alicdn.com/tfs/TB1tcXih4rI8KJjy0FpXXb5hVXa-2534-2006.png)

![img](https://img.alicdn.com/tfs/TB14pXfh8TH8KJjy0FiXXcRsXXa-2536-1998.png)

![img](https://img.alicdn.com/tfs/TB17t0ih4rI8KJjy0FpXXb5hVXa-2542-1996.png)
