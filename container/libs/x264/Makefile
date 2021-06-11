.PHONY: all clean install

SRC_NAME=x264
SRC_VERSION=master
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.bz2
SRC_DIR=$(SRC_NAME)-$(SRC_VERSION)

all: build

$(SRC_DIR):
	curl https://code.videolan.org/videolan/x264/-/archive/master/$(SRC_PACKAGE) | tar jxvf -

install:
	make -C $(SRC_DIR) install

clean:
	make -C $(SRC_DIR) clean

build: $(SRC_DIR)
	cd $(SRC_DIR); \
	./configure \
	    --prefix=/usr \
	    --libdir=/usr/lib \
	    --disable-debug \
	    --enable-shared \
	    --disable-doc \
	    --enable-strip \
	    --system-libx264 \
	|| exit 1
	make -j`nproc` -C $(SRC_DIR) || exit 1

