.PHONY: all clean install

include ./src/directory_defs.mk

all: remove-dist
	make -C src/ $(INSTALL_PARAM)
	npm run webpack -- --env.htdocs_root=$(HTDOCS_ROOT) --env.cgi_root=$(CGI_ROOT)

clean: remove-dist
	make -C src/ clean

remove-dist:
	rm -rf dist/

install-src:
	make -C src install $(INSTALL_PARAM)

install-htdocs: $(DOCS_DIR)/bundle
	cp dist/bundle/* $(DOCS_DIR)/bundle
	cp -r htdocs/* $(DOCS_DIR)
	find $(DOCS_DIR) -type f -exec chmod 644 {} \;

$(DOCS_DIR)/bundle:
	mkdir -p $@

install: install-src install-htdocs
