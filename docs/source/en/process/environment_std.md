title: Application Environment
---

It is a common practice that applications read some environment variables to decide some of their behaviors, e.g. running in prodction mode or development mode. Environment object is used to store environment related information. 

## Obtain the environment object 

The environment object can be obtained via `require('dorapan').environment`.

## Define environment

1. Environment can be defined in global configuration.
2. It can be defined via `procfile.js` as well. Here is an example:

```javascript

module.exports = function(pandora) {
  // If no parameter given, current environment object is returned
  pandora.environment(UrEnvironmentClass);
}

```

## Frequently Used Interfaces

The behaviors of environment object are described by its Interface [Environment](http://www.midwayjs.org/pandora/api-reference/env/interfaces/environment.html) 。

They are listed as below:

**get(name: string): any**

> Retrive the value of an environment variable via its name
> There are some reserved variable names:
> 
> 1. env -> environment identifier，e.g. production/development.
> 1. appName -> name of current application
> 1. appDir -> root directory of current application
> 1. pandoraLogsDir -> directory for storing Pandora log files, it is set to `~/logs` as default.
  
**match(name: string): boolean**

> Judge whether current environment matches the given environment identiifier.


## Extends BaseEnvironment 

Rather than implements the `Environment` interface by yourself, we suggest you extends the `BaseEnvironment` class, which includes some out-of-factory implementations already.

You can obtain the class via `import {BaseEnvironment} from 'pandora'`.

ref: [BaseEnvironment](http://www.midwayjs.org/pandora/api-reference/env/classes/baseenvironment.html) 

It adds a `set()` method and a `constructor` to the original interface.

Here is an example:

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

## DefaultEnvironment

If there is no user defined Environment object given, Pandora uses [DefaultEnvironment](http://www.midwayjs.org/pandora/api-reference/env/classes/defaultenvironment.html) as default. 

It uses `process.env.NODE_ENV` to define current environment. Here is the implementation:

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


