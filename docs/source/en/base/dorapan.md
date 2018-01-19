title: User SDK - Dorapan
---

[Who is Dorapan](https://www.google.com/search?q=dorapan&tbm=isch)

Because the Pandora.js could be global-installed, unable to direct `require('pandora')` in user's project, there are various issues. Recommend to use `require('dorapan')` to refer Pandora.js, get runtime context, get basic classes and so on.

### Install dorapan under user directory 

```bash
tnpm i dorapan --save
```

### require('dorapan') equivalent require('pandora')

```javascript
console.log(require('dorapan') === require('pandora')); // true
```

### API

For running context information, see:


[Facade](http://www.midwayjs.org/pandora/api-reference/pandora/classes/facade.html)

For basic class, see:

[index.ts](https://github.com/midwayjs/pandora/blob/master/packages/pandora/src/index.ts)
