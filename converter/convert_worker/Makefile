.PHONY: all clean install

include ../../directory_defs.mk

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

