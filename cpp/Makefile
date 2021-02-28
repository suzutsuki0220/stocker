.PHONY: all clean install

include ./directory_defs.mk

all:
	make -C config $(INSTALL_PARAM)
	make -C exif_info
	make -C movie_info
	make -C status
	make -C tag_info

clean:
	make -C config clean
	make -C exif_info clean
	make -C movie_info clean
	make -C status clean
	make -C tag_info clean

make-directory:
	mkdir -p $(DOCS_DIR)
	mkdir -p $(DATA_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

install: make-directory install-bin
