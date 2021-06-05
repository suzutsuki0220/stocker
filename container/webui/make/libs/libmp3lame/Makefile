.PHONY: all clean install

SRC_NAME=lame
SRC_VERSION=3.100
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.gz
SRC_DIR=$(SRC_NAME)-$(SRC_VERSION)

all: build

$(SRC_DIR):
	curl https://jaist.dl.sourceforge.net/project/lame/lame/3.100/$(SRC_PACKAGE) | tar zxvf -

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
	    --sysconfdir=/etc \
	    --enable-largefile \
	    --enable-nasm \
	    --with-pic \
	    --with-gnu-ld \
	|| exit 1
	make -j`nproc` -C $(SRC_DIR) || exit 1

