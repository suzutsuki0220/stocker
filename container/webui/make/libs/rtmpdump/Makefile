.PHONY: all clean install

SRC_NAME=rtmpdump
SRC_VERSION=2.3
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tgz
SRC_DIR=$(SRC_NAME)-$(SRC_VERSION)

all: build

$(SRC_DIR):
	#git clone git://git.ffmpeg.org/rtmpdump
	curl http://rtmpdump.mplayerhq.hu/download/$(SRC_PACKAGE) | tar zxvf -

install:
	make -C $(SRC_DIR) install

clean:
	make -C $(SRC_DIR) clean

build: $(SRC_DIR)
	make -j`nproc` -C $(SRC_DIR) || exit 1

