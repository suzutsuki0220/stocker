.PHONY: all clean install

include ../directory_defs.mk

SCRIPT_FILES = convert_worker.pl

all:

clean:

install:
	mkdir -p $(BIN_DIR)
	cp -r $(SCRIPT_FILES) $(BIN_DIR)
	chmod 755 $(addprefix $(BIN_DIR)/,$(SCRIPT_FILES))
