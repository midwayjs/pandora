#!/bin/bash
pkgs=`find packages -maxdepth 1 -mindepth 1`
cwd=`pwd`
for pkg in $pkgs
do
    cd $cwd
    if [ -e "${pkg}/package.json" ]
    then
      cd $pkg
      echo ">>>>>> Tag Clean"
      echo ">>>>>>" $pkg
      SHH="npm dist-tag add `node -e "console.log(require('./package.json').name)"`@`node -e "console.log(require('./package.json').version) $1"
      echo $SHH
      $SHH
    fi
done
cd $cwd
