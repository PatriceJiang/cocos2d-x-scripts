#!/bin/bash
set -x

dst=Debug/

cp -v /i/Github/Google/v8/v8/out/x64.debug/v8.dll* $dst
cp -v /i/Github/Google/v8/v8/out/x64.debug/v8_libbase.dll* $dst
cp -v /i/Github/Google/v8/v8/out/x64.debug/v8_libplatform.dll* $dst
cp -v /i/Github/Google/v8/v8/out/x64.debug/zlib.dll* $dst

