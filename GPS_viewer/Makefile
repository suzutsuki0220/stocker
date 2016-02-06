.PHONY: all clean install

DESTDIR    = /var/www
CGI_DIR    = $(DESTDIR)/cgi-bin
DOCS_DIR   = $(DESTDIR)/html
BASE_DIR   = $(DESTDIR)/stocker
BIN_DIR    = $(BASE_DIR)/bin
LIBS_DIR   = $(BASE_DIR)/lib
CONF_DIR   = $(BASE_DIR)/conf
CACHE_DIR  = $(BASE_DIR)/cache
TRASH_DIR  = $(BASE_DIR)/trash

all:

clean:

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

install-config:
	cp -rn Conf/* $(CONF_DIR)
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $(CONF_DIR)/*

install-libs:
	cp -r lib/* $(LIBS_DIR)

install-htdocs:
	cp -r htdocs/* $(DOCS_DIR)
	find '$(CGI_DIR)' -type f -exec chmod 644 {} \;

install-cgi:
	cp -r cgi-bin/* $(CGI_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       $(CGI_DIR)/*
	find '$(CGI_DIR)' -type f -exec chmod 755 {} \;

install: make-directory install-config install-libs install-cgi

