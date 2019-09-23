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
	chmod 755 $@
