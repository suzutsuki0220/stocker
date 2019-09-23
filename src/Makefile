.PHONY: all clean install

include ./directory_defs.mk

all:
	make -C config
	make -C exif_info
	make -C get_dir
	make -C get_file
	make -C movie_info
	make -C perl-cgi
	make -C status
	make -C taginfo

clean:
	make -C config clean
	make -C exif_info clean
	make -C get_dir clean
	make -C get_file clean
	make -C movie_info clean
	make -C perl-cgi
	make -C status clean
	make -C taginfo clean

install-bin:
	make -C config install $(INSTALL_PARAM)
	make -C exif_info install $(INSTALL_PARAM)
	make -C get_dir install $(INSTALL_PARAM)
	make -C get_file install $(INSTALL_PARAM)
	make -C movie_info install $(INSTALL_PARAM)
	make -C status install $(INSTALL_PARAM)
	make -C taginfo install $(INSTALL_PARAM)
	cp -r ../dist/cgi-bin/* $(CGI_DIR)

libcheck:
	./check_perllib.sh

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

install: libcheck make-directory install-bin
