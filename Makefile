.PHONY: all clean install

include directory_defs.mk

LIB_FILES  = FileOperator.pm HTML_Elem.pm MimeTypes.pm ParamPath.pm
DOC_FILES  = $(wildcard htdocs/*) $(wildcard jsUtils/src/*)
CGI_FILES  = edit.cgi filefunc.cgi stocker.cgi summary.cgi text_viewer.cgi
CONF_FILES = basedirs.conf SupportTypes.pl stocker.conf

all:
	make -C GPS_viewer/
	make -C converter/
	make -C get_file/
	make -C music_player/
	make -C picture_viewer/
	make -C status/
	make -C thumbnail/
	sh -c "cd javascript; npm run webpack"

clean:
	make -C GPS_viewer/ clean
	make -C converter/ clean
	make -C get_file/ clean
	make -C music_player/ clean
	make -C picture_viewer/ clean
	make -C status/ clean
	make -C thumbnail/ clean

make-directory:
	mkdir -p $(CGI_DIR)
	mkdir -p $(DOCS_DIR)
	mkdir -p $(BASE_DIR)
	mkdir -p $(BIN_DIR)
	mkdir -p $(LIBS_DIR)
	mkdir -p $(CONF_DIR)
	mkdir -m 1777 -p $(CACHE_DIR)

install-config:
	cp -rn $(addprefix Conf/,$(CONF_FILES)) $(CONF_DIR)
	sed -i -e 's|%docs_dir%|$(DOCS_DIR)|g' \
	       -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       -e 's|%cache_dir%|$(CACHE_DIR)|g' \
	       -e 's|%trash_dir%|$(TRASH_DIR)|g' \
	       $(addprefix $(CONF_DIR)/,$(CONF_FILES))

install-libs:
	cp -r $(addprefix lib/,$(LIB_FILES)) $(LIBS_DIR)
	cp -r lib/* $(LIBS_DIR)

install-htdocs:
	cp javascript/app/main.js $(DOCS_DIR)
	cp -r $(DOC_FILES) $(DOCS_DIR)
	sed -i -e 's|%cgi_root%|$(CGI_ROOT)|g' \
	       $(DOCS_DIR)/*.js $(DOCS_DIR)/*.html
	find $(DOCS_DIR) -type f -exec chmod 644 {} \;

install-cgi:
	cp -r $(addprefix cgi-bin/,$(CGI_FILES)) $(CGI_DIR)
	sed -i -e 's|%bin_dir%|$(BIN_DIR)|g' \
	       -e 's|%libs_dir%|$(LIBS_DIR)|g' \
	       -e 's|%conf_dir%|$(CONF_DIR)|g' \
	       -e 's|%htdocs_root%|$(HTDOCS_ROOT)|g' \
	       $(addprefix $(CGI_DIR)/,$(CGI_FILES))
	chmod 755 $(addprefix $(CGI_DIR)/,$(CGI_FILES))

install-modules:
	make -C GPS_viewer/ install $(INSTALL_PARAM)
	make -C converter/ install $(INSTALL_PARAM)
	make -C get_file/ install $(INSTALL_PARAM)
	make -C get_dir/ install $(INSTALL_PARAM)
	make -C music_player/ install $(INSTALL_PARAM)
	make -C picture_viewer/ install $(INSTALL_PARAM)
	make -C status/ install $(INSTALL_PARAM)
	make -C thumbnail/ install $(INSTALL_PARAM)

install: make-directory install-config install-libs install-htdocs install-cgi install-modules

