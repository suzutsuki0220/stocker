.PHONY: all clean install

include ../directory_defs.mk

REPLACE_DEST = ../../dist/config
CONF_FILES = $(wildcard *.conf)
CGI_CONFIG = $(wildcard *.pl)

DIST_FILES =  $(addprefix $(REPLACE_DEST)/,$(CONF_FILES) $(CGI_CONFIG))

all: $(DIST_FILES)

clean:
	rm -f $(DIST_FILES)

$(REPLACE_DEST)/%.pl: %.pl
	cp $^ $@

$(REPLACE_DEST)/%.conf: %.conf
	mkdir -p $(@D)
	cp $(subst $(REPLACE_DEST),.,$@) $@
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%cgi_root%|$(CGI_ROOT)|g' \
	       -e 's|%data_dir%|$(DATA_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $@
	chmod 644 $@

install:
	mkdir -p $(CONF_DIR)
	cp -r $(DIST_FILES) $(CONF_DIR)
