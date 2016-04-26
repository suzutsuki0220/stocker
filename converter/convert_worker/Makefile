.PHONY: all clean install

DESTDIR    = /var/www
CGI_DIR    = $(DESTDIR)/cgi-bin/stocker
DOCS_DIR   = $(DESTDIR)/html/stocker
BASE_DIR   = $(DESTDIR)/stocker
BIN_DIR    = $(BASE_DIR)/bin
LIBS_DIR   = $(BASE_DIR)/lib
CONF_DIR   = $(BASE_DIR)/conf
CACHE_DIR  = $(BASE_DIR)/cache
TRASH_DIR  = $(BASE_DIR)/trash

SCRIPT_FILES = convert_worker.pl

all:

clean:

install-script:
	cp -r $(SCRIPT_FILES) $(BIN_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       $(addprefix $(BIN_DIR)/,$(SCRIPT_FILES))
	chmod 755 $(addprefix $(BIN_DIR)/,$(SCRIPT_FILES))

install: install-script

