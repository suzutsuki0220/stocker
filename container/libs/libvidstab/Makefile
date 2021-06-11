.PHONY: all clean install

SRC_NAME=vid.stab
SRC_VERSION=1.3.1
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.gz
SRC_DIR=$(SRC_NAME)

all: build

$(SRC_DIR):
	git clone https://github.com/georgmartius/vid.stab.git --depth=1

install:
	make -C $(SRC_DIR) install

clean:
	make -C $(SRC_DIR) clean

build: $(SRC_DIR)
	cd $(SRC_DIR); \
	cmake . -DCMAKE_INSTALL_PREFIX=/usr  \
	|| exit 1
	make -j`nproc` -C $(SRC_DIR) || exit 1

