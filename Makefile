.PHONY: all clean install

include ./src/directory_defs.mk

all:
	make -C src/ $(INSTALL_PARAM)
	DESTDIR= npm run webpack

clean:
	make -C src/ clean
	rm -rf dist/

install-src:
	make -C src install $(INSTALL_PARAM)

install-htdocs: $(DOCS_DIR)/bundle
	cp dist/bundle/stocker.js $(DOCS_DIR)/bundle
	cp -r htdocs/* $(DOCS_DIR)
	find $(DOCS_DIR) -type f -exec chmod 644 {} \;

$(DOCS_DIR)/bundle:
	mkdir -p $@

install: install-src install-htdocs

