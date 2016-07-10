.PHONY: all clean install

HTDOCS_ROOT = /stocker

DESTDIR    = /var/www
CGI_DIR    = $(DESTDIR)/cgi-bin/stocker
DOCS_DIR   = $(DESTDIR)/html$(HTDOCS_ROOT)
BASE_DIR   = $(DESTDIR)/stocker
BIN_DIR    = $(BASE_DIR)/bin
LIBS_DIR   = $(BASE_DIR)/lib
CONF_DIR   = $(BASE_DIR)/conf
CACHE_DIR  = $(BASE_DIR)/cache
TRASH_DIR  = $(BASE_DIR)/trash

LIB_FILES  = FileOperator.pm HTML_Elem.pm MimeTypes.pm ParamPath.pm
DOC_FILES  = icons ajax_html_request.js
CGI_FILES  = download.cgi edit.cgi edit_filefunc.pl stocker.cgi text_viewer.cgi
CONF_FILES = BaseDirs.pl basedirs.conf SupportTypes.pl stocker.conf

all:
	make -C GPS_viewer/
	make -C converter/
	make -C get_file/
	make -C music_player/
	make -C picture_viewer/
	make -C thumbnail/

clean:
	make -C GPS_viewer/ clean
	make -C converter/ clean
	make -C get_file/ clean
	make -C music_player/ clean
	make -C picture_viewer/ clean
	make -C thumbnail/ clean

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

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
	cp -r lib/* $(LIBS_DIR)

install-htdocs:
	cp -r $(addprefix htdocs/,$(DOC_FILES)) $(DOCS_DIR)
#	chmod 644 $(addprefix $(DOCS_DIR)/,$(DOC_FILES))

install-cgi:
	cp -r $(addprefix cgi-bin/,$(CGI_FILES)) $(CGI_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       $(addprefix $(CGI_DIR)/,$(CGI_FILES))
	chmod 755 $(addprefix $(CGI_DIR)/,$(CGI_FILES))

install-modules:
	make -C GPS_viewer/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT)
	make -C converter/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT)
	make -C get_file/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT) CONF_DIR=$(CONF_DIR)
	make -C music_player/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT)
	make -C picture_viewer/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT)
	make -C thumbnail/ install DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT)

install: make-directory install-config install-libs install-htdocs install-cgi install-modules

