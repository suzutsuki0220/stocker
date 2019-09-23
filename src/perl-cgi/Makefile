.PHONY: all clean install

include ../directory_defs.mk

REPLACE_DEST = ../../dist/cgi-bin
CGI_FILES = $(wildcard *.cgi) $(wildcard action/*.cgi)

all: libcheck $(addprefix $(REPLACE_DEST)/,$(CGI_FILES))

clean:
	rm -f $(addprefix $(REPLACE_DEST)/,$(CGI_FILES))

libcheck:
	../check_perllib.sh

$(REPLACE_DEST)/%.cgi: %.cgi
	mkdir -p $(@D)
	cp $(subst $(REPLACE_DEST),.,$@) $@
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $@
	chmod 755 $@

install-cgi:
	mkdir -p $(CGI_DIR)
	cp -r $(addprefix $(REPLACE_DEST),$(CGI_FILES)) $(CGI_DIR)

install: libcheck install-cgi
