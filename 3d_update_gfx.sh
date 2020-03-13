#!/bin/bash
#set -x
dir1=cocos2d-x-lite
dir2=engine
dir3=jsb-adapter

dir1_branch=3fgfx-win32-adaptation
common_branch=3d-gfx

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

if [ $branch2 != $common_branch ]; then
    echo " [$dir2] should be on ${common_branch}"
    exit -1
fi

if [ $branch3 != $common_branch ]; then 
    echo " [$dir3] should be on ${common_branch}"
    exit -1
fi

if [ $dir1_branch == $branch1 ]; then
    echo " [$dir1] need on ${common_branch}"
    git -C $dir1 stash push
    git -C $dir1 checkout $common_branch
elif [ $common_branch == $branch1 ]; then 
    echo " [$dir1] update"
else
    echo " [$dir1] should be on ${common_branch} or $dir1_branch"
    exit -1
fi


set -x

git -C $dir1 pull
git -C $dir2 pull
git -C $dir3 pull

set +x

if [ $dir1_branch == $branch1 ]; then
    set -x
    git -C $dir1 checkout $branch1
    git -C $dir1 stash pop 
    set +x
fi