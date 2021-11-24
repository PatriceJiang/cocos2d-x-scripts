if [ $# -ne 0 ]; then
    ndk_path=$1
elif [ -n "$HW_NDK" ]; then
    ndk_path=$HW_NDK
else
    echo "Cannot find NDK root path"
    exit 1
fi
mkdir -p build
cp 
cmake -Bbuild \
    -S .\
    -DOHOS_ARCH=arm64-v8a \
    -DCMAKE_BUILD_TYPE=Debug \
    -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
    -DCMAKE_TOOLCHAIN_FILE="$ndk_path/build/cmake/ohos.toolchain.cmake" \
    -DCMAKE_CXX_FLAGS="-I$ndk_path/llvm/include/c++/v1" \
    -DCMAKE_C_FLAGS="-I$ndk_path/llvm/include/c++/v1" \
    -DCMAKE_MAKE_PROGRAM="$ndk_path/build-tools/cmake/bin/ninja" \
    -GNinja \
    -DRES_DIR=../../../build/ohos


cp build/compile_commands.json ../../../compile_commands.json
