.PHONY: all clean install

include ../directory_defs.mk

REPLACE_DEST = ../../dist/cgi-bin
CGI_FILES = $(wildcard *.cgi) $(wildcard action/*.cgi)

all: libcheck cgi
	make -C taginfo

clean:
	rm -f $(REPLACE_DEST)/$(CGI_FILES)

libcheck:
	../check_perllib.sh

cgi: $(addprefix $(REPLACE_DEST)/,$(CGI_FILES))
	mkdir -p $(REPLACE_DEST)
	cp -r $(addprefix cgi-bin/,$(CGI_FILES)) $(REPLACE_DEST)
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $(addprefix $(REPLACE_DEST)/,$(CGI_FILES))
	chmod 755 $(addprefix $(REPLACE_DEST)/,$(CGI_FILES))

install-cgi:
	cp -r $(addprefix $(REPLACE_DEST),$(CGI_FILES)) $(CGI_DIR)

install: libcheck make-directory install-cgi
