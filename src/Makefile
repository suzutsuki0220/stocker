.PHONY: all clean install

include ./directory_defs.mk

all:
	make -C config $(INSTALL_PARAM)
	make -C exif_info
	make -C movie_info
	make -C perl-cgi
	make -C status
	make -C taginfo

clean:
	make -C config clean
	make -C exif_info clean
	make -C movie_info clean
	make -C perl-cgi clean
	make -C status clean
	make -C taginfo clean

install-bin:
	make -C config install $(INSTALL_PARAM)
	make -C exif_info install $(CGI_DIR)
	make -C movie_info install $(CGI_DIR)
	make -C status install CGI_DIR=$(CGI_DIR)
	make -C taginfo install CGI_DIR=$(CGI_DIR)
	cp -r ../dist/cgi-bin/* $(CGI_DIR)

libcheck:
	./check_perllib.sh

install-libs:
	cp -r perl-modules/*.pm $(LIBS_DIR)

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(DATA_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

install: libcheck make-directory install-bin install-libs
