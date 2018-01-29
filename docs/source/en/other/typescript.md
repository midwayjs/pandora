title: Start A TypeScript Project
---

In this chapter, web will introduce how development a TypeScript project within the Pandora.js.

`procfile.js`

```javascript
module.exports = (pandora) => {
  
  if(pandora.dev) {
    
    // if started by pandora dev
    
    // put -r ts-node/register into the worker's definition
    pandora.process('worker').nodeArgs(['-r', 'ts-node/register', '--trace-warnings']);
    
    // start from the source code
    pandora.service('dashboard', './src/Dashboard').process('worker');
    
  } else {
    
    // if started by pandora start, such as the production environment
    
    // start from the built code
    pandora.service('dashboard', './dist/Dashboard').process('worker');
    
  }
};
```

In local development, use `pandora dev`, start it from the source code.  In production environment, use `pandora start`, start it from the built code.
 
 Pandora. js has been installed by default with support for sourceMap, and it's error stack is clearly visible.
