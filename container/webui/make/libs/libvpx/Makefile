.PHONY: all clean install

SRC_NAME=libvpx
SRC_VERSION=1.10.0
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.gz
SRC_DIR=$(SRC_NAME)-$(SRC_VERSION)

all: build

$(SRC_DIR):
	mkdir $(SRC_DIR); cd $(SRC_DIR); \
	curl https://chromium.googlesource.com/webm/libvpx/+archive/b41ffb53f1000ab2227c1736d8c1355aa5081c40.tar.gz | tar zxvf -

install:
	make -C $(SRC_DIR) install

clean:
	make -C $(SRC_DIR) clean
	make -C $(SRC_DIR) distclean

build: $(SRC_DIR)
	cd $(SRC_DIR); \
	./configure \
	    --prefix=/usr \
	    --libdir=/usr/lib \
	    --disable-debug \
	    --enable-shared \
	    --disable-docs \
	|| exit 1
	make -j`nproc` -C $(SRC_DIR) || exit 1

