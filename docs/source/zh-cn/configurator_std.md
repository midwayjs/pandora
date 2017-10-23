# Configurator 标准

用于抽象应用级别的全局配置，默认提供区分环境的文件配置读取能力。

## 主要接口

最基本的 `Configurator` 对象是约束于 Interface [Configurator](classes/Environment.html) 。

只包含如下一个主要接口：

**getAllProperties(options?: ConfiguratorLoadOptions): Promise<any> | any**

获得全部的配置属性，一个的 Javascript 对象。 可以实现为 async 的异步方法，同步读取文件，异步从网络获得配置皆可满足。


## 默认行为 - DefaultConfigurator

如果用户不注入自定义的 `Configurator` 类，我们将使用默认的 `DefaultConfigurator` 。

该类主要是基于 `Environment` 对象的 `get('env')` 来加载区分环境的配置。

按照如下顺序覆盖合并，后缀名可为 `json`、`js` 或其他 Node.js `require()` 支持的后缀名：

```typescript
[
    `${appDir}/config/config`,
    `${appDir}/config/config.default`,
    `${appDir}/config.${env}`
]
```
