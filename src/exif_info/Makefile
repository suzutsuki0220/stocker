# use pkg-config for getting CFLAGS and LDLIBS
EXIF_LIBS=libexif
TARGET=exif_info
CPP=g++

DEST_DIR = ../../dist/cgi-bin

CFLAGS += -Wall -O2 -g
CFLAGS := $(shell pkg-config --cflags $(EXIF_LIBS)) $(CFLAGS)
LDLIBS := $(shell pkg-config --libs $(EXIF_LIBS)) $(LDLIBS)

include ../directory_defs.mk

CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc
CPPFLAGS=$(CFLAGS)

SRC=$(wildcard *.cpp)
OBJS=$(subst .cpp,.o,$(SRC))

.phony: all clean install

all: $(LIBSTOCKER_COMMON) $(addprefix $(DEST_DIR)/,$(TARGET))

.cpp.o:
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LDLIBS)

$(DEST_DIR)/$(TARGET): $(OBJS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $^ $(LDLIBS)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

clean:
	$(RM) $(DEST_DIR)/$(TARGET) $(OBJS)

install:
	mkdir -p $(CGI_DIR)
	cp -r $(DEST_DIR)/$(TARGET) $(CGI_DIR)
