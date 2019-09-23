.PHONY: all clean install

include ../directory_defs.mk

REPLACE_DEST = ../../dist/config
CONF_FILES = $(wildcard *.conf)

all: $(addprefix $(REPLACE_DEST)/,$(CONF_FILES))

clean:
	rm -f $(addprefix $(REPLACE_DEST)/,$(CONF_FILES))

$(REPLACE_DEST)/%.conf: %.conf
	mkdir -p $(@D)
	cp $(subst $(REPLACE_DEST),.,$@) $@
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%cgi_root%|$(CGI_ROOT)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $@
	chmod 755 $@

install:
	mkdir -p $(CONF_DIR)
	cp -r $(addprefix $(REPLACE_DEST)/,$(CONF_FILES)) $(CONF_DIR)
