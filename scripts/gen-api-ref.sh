#!/bin/bash

set -e
pkgs=`find packages -maxdepth 1 -mindepth 1`
cwd=`pwd`
for pkg in $pkgs
do
    cd $cwd
    if [ -e "${pkg}/package.json" ]
    then
      cd $pkg
      echo "*****************************************"
      echo "************* Pandora API ********* X ***"
      echo "*****************************************"
      echo ">>>>>> Generating"
      echo ">>>>>>" $pkg
      echo "*****************************************"
      echo "************************ © Pandora.js **"
      npm run gen-api-ref
    fi
done
wait
cd $cwd
