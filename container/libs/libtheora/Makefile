.PHONY: all clean install

SRC_NAME=libtheora
#SRC_VERSION=1.1.1
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.xz
#SRC_DIR=$(SRC_NAME)-$(SRC_VERSION)
SRC_DIR=theora

all: build

$(SRC_DIR):
	#curl https://ftp.osuosl.org/pub/xiph/releases/theora/$(SRC_PACKAGE) | tar Jxvf -
	git clone https://gitlab.xiph.org/xiph/theora.git --depth=1

install:
	make -C $(SRC_DIR) install

clean:
	make -C $(SRC_DIR) clean

build: $(SRC_DIR)
	cd $(SRC_DIR); \
	./autogen.sh; \
	./configure \
	    --prefix=/usr \
	    --libdir=/usr/lib \
	    --sysconfdir=/etc \
	    --disable-debug \
	    --enable-shared \
	    --disable-doc \
	    --with-gnu-ld \
	|| exit 1
	make -j`nproc` -C $(SRC_DIR) || exit 1

