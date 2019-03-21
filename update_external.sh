#!/bin/bash -x

c2d=cocos2d-x
c3b=cocos2d-x-3rd-party-libs-bin
branch=$(cat ${c2d}/external/config.json |grep "version" |awk -F":"  '{print $2}' | sed -e 's/,//' | sed -e 's/\"//g')

# cd ${c2d}
# git clean -fdx external
# cd ..
cd ${c3b}
git fetch --all
git checkout $branch
rsync -rc --exclude .git * ../${c2d}/external


