title: 可视化管理面板（Pandora-Dashboard ）
---

Pandora Dashboard 是一个本地的 Dashboard，用来查看管理 Pandora.js。Pandora Dashboard 亦是一个普通的 Pandora.js 项目。

项目地址：

<https://github.com/midwayjs/pandora-dashboard>


## 使用方法

```bash
$ npm i pandora-dashboard -g # 全局安装，会全局注册一个命令 pandora-dashboard-dir
$ pandora start --name dashboard `pandora-dashboard-dir` # 使用该命令获得路径，用于启动
```

然后，打开 `http://127.0.0.1:9081` 就能看到了。

![dashboard](https://img.alicdn.com/tfs/TB1pIfEeOqAXuNjy1XdXXaYcVXa-1906-1450.png)

## 自定义 TCP 端口号和 IP 地址
 
 默认，Dashboard 监听在 `http://127.0.0.1:9081`，你也可以改变这一默认行为。
   
```bash
pandora start --name dashboard --env "DASHBORAD_PORT=9081 DASHBOARD_HOST=0.0.0.0" --npm pandora-dashboard
```

## 美图赏析

![img](https://img.alicdn.com/tfs/TB1P44yh2DH8KJjy1XcXXcpdXXa-2536-1992.png)

![img](https://img.alicdn.com/tfs/TB1ZmRBh_vI8KJjSspjXXcgjXXa-2528-1998.png)

![img](https://img.alicdn.com/tfs/TB1k04KhY_I8KJjy1XaXXbsxpXa-2540-1996.png)

![img](https://img.alicdn.com/tfs/TB1tcXih4rI8KJjy0FpXXb5hVXa-2534-2006.png)

![img](https://img.alicdn.com/tfs/TB14pXfh8TH8KJjy0FiXXcRsXXa-2536-1998.png)

![img](https://img.alicdn.com/tfs/TB17t0ih4rI8KJjy0FpXXb5hVXa-2542-1996.png)
