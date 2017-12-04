# Environment 标准

用于抽象环境相关的内容，比如识别生产环境还是开发环境、以及其他扩展的环境相关变量（比如机房信息）。

## 主要接口

最基本的 Environment 对象是约束于 Interface [Environment](https://midwayjs.github.io/pandora/api-reference/env/interfaces/environment.html) 。

简单的来说包含以下方法：

**get(name: string): any**

> 通过一个 name 获得特定的上下文变量
> 
> 保留意义的变量名：
> 
> 1. env -> 当前环境的标识字符串，如 production 、development
  
**match(name: string): boolean**

> 通过一个 name (当前环境的标识字符串) 来匹配当前环境，返回布尔型。 


## 建议使用的基础实现 - 抽象类 BaseEnvironment

这里我们建议直接继承我们的基础实现 BaseEnvironment，通过`import {BaseEnvironment} from 'pandora'`获得。

详细参见类型信息： [BaseEnvironment](https://midwayjs.github.io/pandora/api-reference/env/classes/baseenvironment.html) 

该类扩展出 `constructor()`、`set()` 等默认行为与方法。

下面是一个例子

```typescript
import {BaseEnvironment} from 'pandora';
export class ForceTestEnvironment extends BaseEnvironment {
  constructor(variables?: any) {
    variables = variables || {};
    if(!variables.env) {
      variables.env = 'test';
    }
    super(variables);
  }
  match(name: string): boolean {
    return this.get('env') === name;
  }
}
```

## 默认行为 - DefaultEnvironment

如果用户不注入自定义的 Environment 类，我们将使用默认的 [DefaultEnvironment](https://midwayjs.github.io/pandora/api-reference/env/classes/defaultenvironment.html) 。

该类主要是基于 `process.env.NODE_ENV` 判读当前环境，主要实现如下：

```typescript
switch (process.env.NODE_ENV) {
  case 'production':
    variables.env = 'production';
    break;
  case 'prepub':
    variables.env = 'prepub';
    break;
  case 'test':
  case 'unittest':
    variables.env = 'test';
    break;
  default:
    variables.env = 'development';
    break;
}
```


