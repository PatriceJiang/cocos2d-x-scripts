#!/bin/bash 

if [ ! -d $COCOS_CONSOLE_ROOT ]; then
	echo "ENV \$COCOS_CONSOLE_ROOT is not set!"
	exit -1
fi
fmod_src=$COCOS_CONSOLE_ROOT/../../../external/linux-specific/fmod/prebuilt/64-bit

cd $fmod_src

if [ -f libfmod.so.6 ]; then
	echo "remove existing libfmod.so.6"
	unlink libfmod.so.6
fi	

if [ -f libfmodL.so.6 ]; then
	echo "remove existing libfmodL.so.6"
	unlink libfmodL.so.6
fi	

if [ -f libfmod.so ]; then
	ln -s libfmod.so libfmod.so.6
fi
if [ -f libfmodL.so ]; then
	ln -s libfmodL.so libfmodL.so.6
fi

echo "Result ... "
tree

