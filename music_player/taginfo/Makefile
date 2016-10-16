debug=1

TARGET=taginfo
OBJECTS=
CC=gcc
CPP=g++
LIBPARAM=-ltag

COMMON_MODULE=../../common_module/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I../../common_module

CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install

#all: $(TARGET)
all: $(OBJECTS) $(COMMON_MODULE)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $< $(LIBPARAM)

#$(TARGET): $(OBJECTS) $(COMMON_MODULE)
#	$(CPP) $(CPPFLAGS) -o $@ $^ $(LIBPARAM)

$(COMMON_MODULE):
	make -C ../../common_module

clean:
	$(RM) $(TARGET) $(OBJECTS) *~
	make -C ../../common_module clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -o $(CGI_DIR)/$(TARGET) $(OBJECTS) taginfo.cpp $(COMMON_MODULE) $(LIBPARAM)
