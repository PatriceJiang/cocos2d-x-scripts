#!/bin/bash
#set -x

set -e
dir1=cocos2d-x-lite
dir2=engine
dir3=jsb-adapter



if [ ! -d $dir1 ]; then
    echo "dir $dir1 not exits";
    exit -1
fi

if [ ! -d $dir2 ]; then
    echo "dir $dir2 not exits";
    exit -1
fi

if [ ! -d $dir3 ]; then
    echo "dir $dir3 not exits";
    exit -1
fi


branch1=`git -C $dir1 branch --show-current`
branch2=`git -C $dir2 branch --show-current`
branch3=`git -C $dir3 branch --show-current`

echo "[$dir1] on $branch1"
echo "[$dir2] on $branch2"
echo "[$dir3] on $branch3"

