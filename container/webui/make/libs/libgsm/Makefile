.PHONY: all clean install

SRC_NAME=gsm
SRC_VERSION=1.0.19
SRC_PACKAGE=$(SRC_NAME)-$(SRC_VERSION).tar.gz
SRC_DIR=$(SRC_NAME)-1.0-pl19

DEST_DIR=

CFLAGS=-c -O2 -DNeedFunctionPrototypes=1 -fPIC
CPPFLAGS=-O2
CXXFLAGS=-O2
export CFLAGS CPPFLAGS CXXFLAGS

all: build

$(SRC_DIR):
	curl http://www.quut.com/gsm/$(SRC_PACKAGE) | tar zxvf -

install:
	make -C $(SRC_DIR) install INSTALL_ROOT=$(DEST_DIR)/usr GSM_INSTALL_LIB=$(DEST_DIR)/usr/lib GSM_INSTALL_INC=$(DEST_DIR)/usr/include GSM_INSTALL_MAN=$(DEST_DIR)/usr/man/man3
	#strip $(DEST_DIR)/usr/bin/* $(DEST_DIR)/usr/sbin/*
	#gzip -9 $(DEST_DIR)/usr/man/man?/*
	#cd ${DEST_DIR}/usr/include; ln -s gsm/gsm.h gsm.h

clean:
	make -C $(SRC_DIR) clean

build: $(SRC_DIR)
	cd $(SRC_DIR); \
	make -j`nproc` CCFLAGS="$(CFLAGS)" || exit 1

