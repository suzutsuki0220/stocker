debug=1

TARGET=taginfo
OBJECTS=
CC=gcc
CPP=g++
LIBPARAM=-ltag

COMMON_MODULE_DIR=../common
COMMON_MODULE=$(COMMON_MODULE_DIR)/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc

CPPFLAGS=$(CFLAGS)

include ../directory_defs.mk

.phony: all clean install

#all: $(TARGET)
all: make_noimage noimage.h $(OBJECTS) $(COMMON_MODULE)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LIBPARAM)

#$(TARGET): $(OBJECTS) $(COMMON_MODULE)
#	$(CPP) $(CPPFLAGS) -o $@ $^ $(LIBPARAM)

$(COMMON_MODULE):
	make -C $(COMMON_MODULE_DIR)

make_noimage: make_noimage.c
	$(CC) $(CFLAGS) $< -o $@

noimage.h: noimage/noimage.png
	./make_noimage $< $@

clean:
	$(RM) $(TARGET) $(OBJECTS) noimage.h make_noimage *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) taginfo.cpp $(COMMON_MODULE) $(LIBPARAM)
