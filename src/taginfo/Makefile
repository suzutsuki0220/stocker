debug=1

TARGET=taginfo
INC=$(wildcard Inc/*.h Inc/*.hpp)
SRC=taginfo.cpp
OBJECTS=$(subst .cpp,.o,$(SRC))
CC=gcc
CPP=g++
LIBPARAM=-ltag

include ../directory_defs.mk

DEST_DIR = ../../dist/cgi-bin

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+=-I$(COMMON_MODULE_DIR)/Inc

CPPFLAGS=$(CFLAGS)

.phony: all clean install

all: $(LIBSTOCKER_COMMON) $(addprefix $(DEST_DIR)/,$(TARGET))

$(DEST_DIR)/$(TARGET): noimage.h $(OBJECTS) $(LIBSTOCKER_COMMON)
	$(CPP) $(CPPFLAGS) -o $@ $^ $(LIBPARAM)

%.o: %.cpp $(INC)
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LIBPARAM)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

make_noimage: make_noimage.c
	$(CC) $(CFLAGS) $< -o $@

noimage.h: noimage/noimage.png make_noimage
	./make_noimage $< $@

clean:
	$(RM) $(DEST_DIR)/$(TARGET) $(OBJECTS) noimage.h make_noimage *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	cp -r $(DEST_DIR)/$(TARGET) $(CGI_DIR)
