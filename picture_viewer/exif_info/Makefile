# use pkg-config for getting CFLAGS and LDLIBS
EXIF_LIBS=libexif
TARGET = exif_info

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

OBJS=$(addsuffix .o,$(TARGET))

.phony: all clean install

all: $(OBJS)

clean:
	$(RM) $(TARGET) $(OBJS)

install:
	mkdir -p $(CGI_DIR)
	$(CC) $(CFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) $(TARGET).c $(LIBSTOCKER_COMMON) $(LDLIBS)
