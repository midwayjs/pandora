#!/bin/bash

pkgs=`find packages -maxdepth 1 -mindepth 1`
cwd=`pwd`
for pkg in $pkgs
do
    cd $cwd
    if [ -e "${pkg}/package.json" ]
    then
      cd $pkg
      echo ">>>>>> Publishing"
      echo ">>>>>>" $pkg
      npm publish --tag=pandora2-beta
    fi
done
cd $cwd
