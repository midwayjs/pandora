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
      npm dist-tag rm pandora-`basename "$PWD"` $2
    fi
done
cd $cwd
