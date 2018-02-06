title: Quick Start
---

## Environment

- OS: macOS / Linux
- Node.js Runtime: >= 8.x.x, latest LTS version is recommended

## The goal of this chapter

1. Understand `procfile.js` configuration.
2. Understand basic commands: start, stop, dev, exit, and list.


## Installation


Pandora.js can be installed locally with your Node.js project. It can also be installed globally.

```sh
npm i pandora -g  // Install with the global mode
npm i pandora --save   // Install with the local mode
```

## Generate procfile.js

Pandora.js defines the application process structure via the `procfile.js` file in project root directory, so you need to add a `procfile.js` file in the project root directory.

This chapter will introduce the basic Fork and Cluster modes, you can choose either mode based on your scenario.

#### Fork mode

Fork mode is kind of straightforward, it just launch the application, say, run `node app.js` directly.

You can use the init command to generate a `procfile.js` with fork mode:

```bash
$ pandora init ./app.js # Here app.js is the launch entry of your Node.js application
? Which type do you like to generate ? (Use arrow keys)
❯ fork 
  cluster 
** The procfile.js was generated to location /xx/xx/procfile.js **
```

Here you have a `procfile.js` with default values. You can have a glimpse of file content here:

```javascript
module.exports = (pandora) => {
  pandora
    .fork('appName', './app.js');
}
```

#### Cluster mode

Cluster mode is frequently adopted by Node.js applications in production. Pandora.js launch multiple workers, the same number as cpu cores by default, for applications to max the CPU performance. You can tune this setting based on your own flavor.

You can use the init command to generate a `procfile.js` with cluster mode:

```bash
$ pandora init ./app.js # Here app.js is the launch entry of your Node.js application
? Which type do you like to generate ? (Use arrow keys)
  fork 
❯ cluster 
** The procfile.js was auto generated to location /xx/xx/procfile.js **
```

Here you have a `procfile.js` with default values. You can have a glimpse of file content here:

```javascript
module.exports = (pandora) => {

  pandora
    // launch app.js using the cluster mode, with the default setting
    .cluster('./app.js'); 
 
  /* Custom the number of workers
  pandora
    .process('worker')
    // Change the `worker` process numbers to 2.
    .scale(2);

    // By the way, The default process number is defined as `pandora.dev ? 1 : 'auto'`.
    // Which means if it is in development mode, pandora.js will not launch applications in cluster mode,
    // otherwise it launches applications in cluster mode.
  */
    
}
```

# Start or stop through `npm run` 

Other than process management, Pandora.js can also help with application lifecycle management.

We suggest you use pandora.js to start/stop your node.js applications. You define the script section of package.json as below:

```json
// package.json
{
  "script": {
    "dev": "pandora dev",
    "start": "pandora start",
    "stop": "pandora stop"
  }
}
```

Now，you can use `npm run` to start/stop your application: 

```
npm run dev // Local start
npm run start // Production start
npm run stop // Production stop
```

## Start and stop in global mode

```sh
pandora start [--name xxx] [path]
```

Here is an example, we launch the application in the application root directory, and name it `helloApp`.
```sh
pandora start
pandora start --name helloApp
```

If `name` is not specified, Pandora.js will take the last part of the root directory or the value of `name` property in package.json as the application name. The application will be launched silently, according to the default definition in `procfile.js` and run in the background.

As soon as the application is launched, it can be viewed through the `list` command:

```sh
pandora list
```

you can also stop it with `stop` command:

```sh
pandora stop
```

> Since Pandora.js used to run global mode in background, it is strongly suggested to deploy it on the server beforehand.

After the application is launched, the daemon process will keep resident in memory even the application is stopped. You can quit the daemon process via the command below:

```sh
pandora exit
```

If you do want to run the applications at foreground, you can choose the `dev` command ( only for local debugging):

```sh
pandora dev
```