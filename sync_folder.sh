#!/bin/bash 

unamestr=`uname`
root="/mnt"

if [[ $unamestr =~ .*CYGWIN.* ]]; then
	echo "using cygwin"
	root="/cygdrive"
fi


src_folder=${root}/e/Github/cocos2d-x/tests/lua-tests/src
dst_folder=${root}/e/Projects/MetalTrans/bin/lua-tests/Debug/Resources/src

echo "copy files ... "
rsync -rvu $src_folder/* $dst_folder
echo "watching files ..."
while inotifywait -r $src_folder/*; do 
	rsync -rvu $src_folder/* $dst_folder
done
