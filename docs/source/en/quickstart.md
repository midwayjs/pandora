title: Quick Start
---

## Environment

OS: macOS / Linux
Node.js Runtime: >= 8.x.x, latest LTS version is recommended

## The goal of this chapter

1. Understand the basic `procfile.js` file writing.
2. Understand the most basic commands, such as start, stop, dev, exit, list.


## Installation


Pandora.js can be installed directly in your Node.js project, and it can also be installed in the global.

```sh
npm i pandora -g  // Install in the global
npm i pandora --save   // Install in your project
```

## Generate procfile.js

Pandora.js defines the application process structure by a `procfile.js` in the project root directory, so you need to add a `procfile.js` file in the project root directory.

This chapter will introduce the most simplest Fork and Cluster methods, and these two methods you only need to choose one.

#### Fork method

the fork method is the most simplest way, it simply pull up a application, just like run `node app.js` directly.

Use the init command to generate a `procfile.js`:

```bash
$ pandora init ./app.js # The app.js is the path of your Node.js application
? Which type do you like to generate ? (Use arrow keys)
❯ fork 
  cluster 
** The procfile.js was auto generated to location /xx/xx/procfile.js **
```

Then you will get a default `procfile.js` and you can take a look, and the contents are as bellow (removed comments):

```javascript
module.exports = (pandora) => {
  pandora
    .fork('appName', './app.js');
}
```

#### Cluster method

The cluster method usually used for Node.js Web Server, and Pandora.js starts CPU number of workers by default (but you can also change this default value).


Use the init command to generate a `procfile.js`:

```bash
$ pandora init ./app.js # The app.js is the path of your Node.js application
? Which type do you like to generate ? (Use arrow keys)
  fork 
❯ cluster 
** The procfile.js was auto generated to location /xx/xx/procfile.js **
```

Then you will get a default `procfile.js` and you can take a look, and the contents are as bellow (removed comments):

```javascript
module.exports = (pandora) => {

  pandora
  
    // Default start to process group `worker`
    .cluster('./app.js'); 
 
  /* Custom the number of workers
  pandora
    .process('worker')
    
    // Modify the process group `worker` always to start 2 workers.
    // The default is pandora.dev ? 1 : 'auto'.
    // It means in dev mode will not start as a cluster.
    // Otherwise if started by `pandora start`, that will start as a cluster.
    .scale(2); 
  */
    
}
```

# Start or stop through `npm run` 

In this scene, Pandora.js will join the whole development processes of the application.

In general, put the Pandora.js commands in the scripts part of package.json.

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

Then， you can use `npm run` to start, such as: 

```
npm run dev // Local start
npm run start // Production start
npm run stop // Production stop
```

## Start and stop under global installation

```sh
pandora start [--name xxx] [path]
```
For example, in a application root directory, and it named `helloApp`.

```sh
pandora start
pandora start --name helloApp
```

The first command will take the last part of directory or the name from package.json as the application name. Then the application will start silently, according to the definition from procfile.js and run in the background.


After the application is started, it can be viewed through the list command:

```sh
pandora list
```

you can also stop it:

```sh
pandora stop
```

> Because the Pandora.js global mode is generally started in the background, it is best to deploy to the server to do so.

After the start command is used to start the application, the Daemon process will still be resident in memory. At this scene, manual exit is needed to exit the Daemon process:

```sh
pandora exit
```

If you want to start a application at front, you can use the dev command ( only for local debugging ):

```sh
pandora dev
```
