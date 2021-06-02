.PHONY: all clean install

all: build

x265:
	hg clone http://hg.videolan.org/x265

build: x265
	cmake -G "Unix Makefiles" ./x265/source \
	    -DCMAKE_INSTALL_PREFIX=/usr \
	    -DHIGH_BIT_DEPTH=ON \
	    -DLIB_INSTALL_DIR=lib64
	make -C x265
