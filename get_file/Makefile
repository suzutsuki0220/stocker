debug=1

TARGET=get_file
OBJECTS=Range.o
CC=gcc
CPP=g++

MODULES=../common_module/libcommonmodule.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I../common_module

CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install

all: $(OBJECTS) $(MODULES)

../common_module/libcommonmodule.a:
	make -C ../common_module/

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET) $(OBJECTS) get_file.o *~
	make -C ../common_module/ clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) get_file.cpp $(MODULES)
