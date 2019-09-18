.PHONY: all clean install

include ../directory_defs.mk

LIB_FILES  = ConverterJob.pm
DOC_FILES  = $(wildcard htdocs/*)
CGI_FILES  = converter.cgi get_movieimg.cgi convertlist.cgi
CONF_FILES = converter.conf ConvertParams.pl

all:
	make -C movie_info

clean:
	rm -f *~
	make -C movie_info clean

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

libcheck:
	./library_check.sh

install-config:
	cp -rn $(addprefix Conf/,$(CONF_FILES)) $(CONF_DIR)
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $(addprefix $(CONF_DIR)/,$(CONF_FILES))

install-libs:
	cp -r $(addprefix lib/,$(LIB_FILES)) $(LIBS_DIR)

install-htdocs:
	cp -r $(DOC_FILES) $(DOCS_DIR)
	chmod 644 $(addprefix $(DOCS_DIR)/,$(DOC_FILES:htdocs/%=%))

install-cgi:
	cp -r $(addprefix cgi-bin/,$(CGI_FILES)) $(CGI_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       $(addprefix $(CGI_DIR)/,$(CGI_FILES))
	chmod 755 $(addprefix $(CGI_DIR)/,$(CGI_FILES))

install-bin:
	make -C movie_info install $(INSTALL_PARAM)
	make -C convert_worker install $(INSTALL_PARAM)

install: libcheck make-directory install-config install-htdocs install-cgi install-bin install-libs

