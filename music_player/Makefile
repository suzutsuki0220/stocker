.PHONY: all clean install

HTDOCS_ROOT = /stocker

DESTDIR    = /var/www
CGI_DIR    = $(DESTDIR)/cgi-bin$(HTDOCS_ROOT)
DOCS_DIR   = $(DESTDIR)/html/stocker
BASE_DIR   = $(DESTDIR)/stocker
BIN_DIR    = $(BASE_DIR)/bin
LIBS_DIR   = $(BASE_DIR)/lib
CONF_DIR   = $(BASE_DIR)/conf
CACHE_DIR  = $(BASE_DIR)/cache
TRASH_DIR  = $(BASE_DIR)/trash

LIB_FILES  =
DOC_FILES  =
CGI_FILES  = get_media.cgi music_player.cgi
CONF_FILES = music_player.conf

all:
	make -C taginfo

clean:
	rm -f *~
	make -C taginfo clean

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
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $(addprefix $(CONF_DIR)/,$(CONF_FILES))

install-libs:
	cp -r $(addprefix lib/,$(LIB_FILES)) $(LIBS_DIR)
	cp -r lib/* $(LIBS_DIR)

install-htdocs:
	cp -r $(addprefix htdocs/,$(DOC_FILES)) $(DOCS_DIR)
	chmod 644 $(addprefix $(DOCS_DIR)/,$(DOC_FILES))

install-cgi:
	cp -r $(addprefix cgi-bin/,$(CGI_FILES)) $(CGI_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       $(addprefix $(CGI_DIR)/,$(CGI_FILES))
	chmod 755 $(addprefix $(CGI_DIR)/,$(CGI_FILES))

install-bin:
	make -C taginfo install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT) CONF_DIR=$(CONF_DIR)

install: libcheck make-directory install-config install-cgi install-bin

