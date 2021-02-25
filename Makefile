.PHONY: all clean install

include ./cpp/directory_defs.mk

all: remove-dist
	make -C cpp/ $(INSTALL_PARAM)
	npm run webpack -- --env htdocs_root=$(HTDOCS_ROOT) --env cgi_root=$(CGI_ROOT)

clean: remove-dist
	make -C cpp/ clean

remove-dist:
	rm -rf dist/
