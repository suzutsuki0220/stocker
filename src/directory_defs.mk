HTDOCS_ROOT = /stocker
CGI_ROOT    = /cgi-bin/stocker

DESTDIR    = /var/www
CGI_DIR    = $(DESTDIR)/cgi-bin/stocker
DOCS_DIR   = $(DESTDIR)/html$(HTDOCS_ROOT)
BASE_DIR   = $(DESTDIR)/stocker
BIN_DIR    = $(BASE_DIR)/bin
LIBS_DIR   = $(BASE_DIR)/lib
CONF_DIR   = $(BASE_DIR)/conf
CACHE_DIR  = $(BASE_DIR)/cache
TRASH_DIR  = $(BASE_DIR)/trash

INSTALL_PARAM += DESTDIR=$(DESTDIR) CGI_DIR=$(CGI_DIR) DOCS_DIR=$(DOCS_DIR) BASE_DIR=$(BASE_DIR) HTDOCS_ROOT=$(HTDOCS_ROOT) CONF_DIR=$(CONF_DIR)

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)
