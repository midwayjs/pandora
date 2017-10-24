# Contributing to Pandora.js


## 开发规范

### 多个 NPM 包在一个仓库？

是的，我们是一个包在一个仓库，我们使用了 lerna 来管理这些包，实现关联和统一发布、管理。

### 我们目录结构如下

* scripts => 一些脚本
* packages => 所有的包都在这下面
	* 某个具体的 NPM 包
		* src 源代码
		* dist 编译后的代码
		* test 功能测试
		
### 每个 Package 应该暴露的命令

* tnpm run build => 编译
* tnpm run lint => 执行对 test、src 目录的 lint
* tnpm run test => 执行测试
* tnpm run cov => 覆盖率
* tnpm run gen-api-ref => 生成 API-Reference

### 根目录暴露的命令
    
* tnpm run bootstrap => lerna bootstrap
* tnpm run test => 对所有 packages 执行单元测试
* tnpm run cov => 对所有 packages 执行覆盖率测试
* tnpm run build => 对所有 packages 执行 build
* tnpm run publish => 发布到 npm
* tnpm run clean => lerna clean
* tnpm run purge => 清除所有依赖
* tnpm run gen-api-ref => 生成全部 API-Reference
* tnpm run ci => 执行 CI


### 开发新功能

1. checkout 新分支 features/xxx
2. 开发功能
3. 向提交 develop merge （通过 MR 或 PR）
4. 合并至 develop

### 如何执行单元测试

* npm run test
* 亦可通过 IDE 执行 Mocha


## 质量控制

### 单元测试相关

1. 工具
	* 测试框架：Mocha	
	* 断言工具：chai 的 expect 形式
	* Mock工具：mm 
	* 覆盖率工具：istanbul
2. 要求
	* 测试覆盖率：Statement 90% 以上，Branch 80% 以上


### 静态分析

提高软件的鲁棒性、安全性，需要对软件进行一些静态的分析与约束

1. 类型系统
	* 引入 TypeScript
	* 类型系统可以提供一些类似 Interface 的约束，或类型推断分析的能力，对于发现软件问题较为有用

2. 三方包检查
	* 使用 nsp
	* 在集成中执行 nsp

### 代码风格

1. 工具
	* 使用 TSLint 检查代码风格
2. 执行方式
	* 构建之前
	

### debug 埋点规范

```
const debug = require('debug')('pandora:pakageName:ClassName');
```

* 直接require一个debug包
* 埋点名称由三部分组成
    * `pandora`
    * 包名称
    * 类名或组件名

### 文档规范

1. 工具
	* typedoc 生成 API-Reference

<!--

### 关于版本

1. Pandora.js 下的所有版本都是固定的，所有的更新都体现在 Pandora.js 的版本变化上
2. 类似 Linux 偶数表示稳固版本，奇数表示开发中版本

### 操作系统

* Linux
* Mac
* Window // 不主要关注

-->
