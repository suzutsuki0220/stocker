# use pkg-config for getting CFLAGS and LDLIBS
EXIF_LIBS=libexif
TARGET = exif_info
CPP=g++

CFLAGS += -Wall -O2 -g
CFLAGS := $(shell pkg-config --cflags $(EXIF_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(EXIF_LIBS)) $(LDLIBS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

COMMON_MODULE_DIR=../../common_module
LIBSTOCKER_COMMON=$(COMMON_MODULE_DIR)/libstockercommon.a
CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc

CPPFLAGS=$(CFLAGS)

OBJS=$(addsuffix .o,$(TARGET))

.phony: all clean install

all: $(OBJS) $(COMMON_MODULE)

$(COMMON_MODULE):
	make -C $(COMMON_MODULE_DIR) 

clean:
	$(RM) $(TARGET) $(OBJS)

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) $(TARGET).cpp $(LIBSTOCKER_COMMON) $(LDLIBS)
