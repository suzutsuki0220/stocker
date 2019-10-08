.PHONY: all clean install

include ./src/directory_defs.mk

all:
	make -C src/ $(INSTALL_PARAM)
	npm run webpack

clean:
	make -C src/ clean
	rm -rf dist/

install-src:
	make -C src install $(INSTALL_PARAM)

install-htdocs:
	cp dist/bundle/stocker.js $(DOCS_DIR)
	cp -r htdocs/* $(DOCS_DIR)
	find $(DOCS_DIR) -type f -exec chmod 644 {} \;

install: install-src install-htdocs

