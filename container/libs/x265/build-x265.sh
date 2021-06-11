#!/bin/sh

if [ ! -d x265 ]; then
    hg clone http://hg.videolan.org/x265
fi

cd ./x265/build/linux
cmake -G "Unix Makefiles" ../../source \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DHIGH_BIT_DEPTH=ON \
    -DLIB_INSTALL_DIR=lib
make -j`nproc`
