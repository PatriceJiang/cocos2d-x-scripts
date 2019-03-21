#!/bin/bash

#############################################################
#
# 用于更新cocos2d-x/external. 
####
# 由于cocos2d-x/download-deps.py 需要通过网络下载第三方库, 在网络
# 较差(大部分)的情况下, 比较耗时耗心力.  这个脚本的作用就是简单地
# 从相邻目录 cocos2d-x-3rd-party-libs-bin中拷贝文件, 不需要重复下载.
# 从而改善体验. 
# 
# LIMITS
# - PWD和__dirname相对目录没有处理好
#############################################################

script_path=$(dirname "$0")

c2d=$script_path/../cocos2d-x
c3b=$script_path/../cocos2d-x-3rd-party-libs-bin

if [ ! -d ${c2d}  ]; then
    echo "-- cocos2d-x folder not found!"
    exit -1
fi

if [ ! -d ${c3b}  ]; then
    echo "-- cocos2d-x-3rd-party-libs-bin folder not found!"
    exit -1
fi

branch=$(cat ${c2d}/external/config.json |grep "version" |awk -F":"  '{print $2}' | sed -e 's/,//' | sed -e 's/\"//g')

echo "-- 3rd-party-libs version: ${branch}"

# cd ${c2d}
# git clean -fdx external
# cd ..
cd ${c3b}
echo "-- update 3rd-party-libs repo ... "
git fetch --all
echo "-- checkout to ${branch} ... "
git checkout $branch
echo "-- copy files to cocos2d-x/external .."

rc=$(env rsync --version)

if [ $? -eq 0 ] ; then
    rsync -rc --exclude .git * ${c2d}/external
else
    echo "-- rsync not found, use tar instead"
    tar -c --exclude .git . | tar -x -C ${c2d}/external
fi

echo "-- done!"


