#!/bin/bash 

src_folder=/mnt/e/Github/cocos2d-x/tests/lua-tests/src
dst_folder=/mnt/e/Projects/MetalTrans/bin/lua-tests/Debug/Resources/src

while inotifywait -r $src_folder/*; do 
	rsync -rvu $src_folder/* $dst_folder
done
