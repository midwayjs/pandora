#!/bin/bash

set -e
pkgs=`find packages -maxdepth 1 -mindepth 1`
cwd=`pwd`

cp ./README.md ./packages/pandora/README.md
npm run authors

for pkg in $pkgs
do
    cd $cwd
    if [ -e "${pkg}/package.json" ]
    then
      cd $pkg
      echo "*****************************************"
      echo "************ Pandora Build ******** X ***"
      echo "*****************************************"
      echo ">>>>>> Building"
      echo ">>>>>>" $pkg
      echo "*****************************************"
      echo "************************ © Pandora.js ***"
      npm run build
    fi
done
cd $cwd
