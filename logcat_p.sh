#!/bin/bash 

#echo "argus size $#"

if [ $# -eq 0 ]; then
	echo "arg pacakge name"
	exit 1
fi

tpid=`adb shell ps -elf |grep $1| awk '{print $2}'`

if [ "$tpid" == "" ]; then
	echo "process '$1' not found"
	exit 1
fi

echo "Process id $tpid"
adb logcat | grep $tpid 
