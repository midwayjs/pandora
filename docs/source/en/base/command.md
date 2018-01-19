title: Commands
---

The pandora.js provides some useful CLI commands, show in below:

- init
- start
- stop
- restart
- list
- log
- ps
- exit
- dev

## init - Initiate a Pandora.js project

```bash
pandora init <filePath> --name customName
```


Quick generate `procfile.js`.

1. `<filePath>` required, the path of entry file.
2. `--name` optional, the process name for fork mode.

Example:

```bash
$ pandora init ./app.js
? Which type do you like to generate ? (Use arrow keys)
❯ fork 
  cluster 
** The procfile.js was auto generated to location /xx/xx/procfile.js **
```
## start - Start an application

```bash
pandora start [path] --name urAppName --env="NODE_ENV=production" --node-args="--expose-gc"
```

The most commonly used start commands are used to start a application.

1. `[path]` Required, project directory, by default as working directory.
2. `--name=urAppName` Optional, for specify the name of application, by default as the name in package.json or last part of working directory path.
3. `--env="NODE_ENV=production"` Optional, for specify the environmental variables, can got by process.env.
4. `--node-args="--expose-gc"` Optional, for specify the Node.js execArgv.
4. `--args="--a=b"` Optional, for specify the args of Node.js application.

Example:

```bash
# Working dir is  /home/admin/mytaobao/target/mytaobao ( suppose there is no name in package.json )

pandora start # Start application mytaobao, such as --name=mytaobao
pandora start . --name mytaobao # Same as above
pandora start `pwd` # Same as above
```

## stop - stop an application

> Notice: Only the application that start by start command can stop by this command

```bash
pandora stop [appName]
```

stop an application.

1. `[appName]` Optional, for specify the name of application, by default as the name in package.json or last part of working directory path.

Example:

```bash
pandora stop mytaobao # mytaobao is the name that was previously started, and if you did't specified a name, that will automatically get name as well as start.
```

## restart - Restart an application

```bash
pandora restart [appName]
```

Equivalent to `pandora stop` and then `pandora start`.


1. `[appName]` Optional, for specify the name of application, by default as the name in package.json or last part of working directory path.

Example:

```bash
pandora restart mytaobao # mytaobao is the name that was previously started, and if you did't specified a name, that will automatically get name as well as start.
```

## list - List all running applications

> Notice: The dev command will not start the daemon process, this command cannot get the information of it.

```bash
pandora list
```

List all applications, example as below:

![list](https://img.alicdn.com/tfs/TB107mPeOqAXuNjy1XdXXaYcVXa-2646-330.png) 


## log - View logs

```bash
pandora log [appName] --follow --lines --full --daemon
```

1. `[appName]` Optional, for specify the name of application, by default as the name in package.json or last part of working directory path.
2. `--follow` Optional, alias as  `-f`, just like `tail -f`.
3. `--lines` Optional, alias as `-l`, output the last few lines, by default as 50.
4. `--full` Optional, output all logs.
5. `--daemon` Optional, output logs of the daemon process.

## ps - View processes tree

```bash
pandora ps <appName>
```

1. `<appName>` Required, the name of application.


## exit - Quit the Pandora.js

Complete exit of the Pandora.js process, and stop all running applications.

```bash
pandora exit
```

## dev - Start an application at front

> Notice: this command will not start the daemon process, the list command cannot get the information of it.

```bash
pandora dev [path] --name urAppName --env="NODE_ENV=production" --node-args="--expose-gc"
```

Start an application at front without the daemon process, logs output to stdout directly.
It is mostly used for local debugging, the parameters similar with the start command.

1. `[path]` Required, project directory, by default as working directory.
2. `--name=urAppName` Optional, for specify the name of application, by default as the name in package.json or last part of working directory path.
3. `--env="NODE_ENV=production"` Optional, for specify the environmental variables, can got by process.env.
4. `--node-args="--expose-gc"` Optional, for specify the Node.js execArgv.
4. `--args="--a=b"` Optional, for specify the args of Node.js application.


