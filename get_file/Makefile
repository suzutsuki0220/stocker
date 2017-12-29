debug=1

TARGET=get_file
OBJECTS=Range.o
CC=gcc
CPP=g++

COMMON_MODULE_DIR=../common_module
LIBSTOCKER_COMMON=$(COMMON_MODULE_DIR)/libstockercommon.a

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CFLAGS+= -I$(COMMON_MODULE_DIR)

CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install

all: $(OBJECTS) $(LIBSTOCKER_COMMON)

$(LIBSTOCKER_COMMON):
	make -C $(COMMON_MODULE_DIR)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET) $(OBJECTS) $(TARGET).o *~
	make -C $(COMMON_MODULE_DIR) clean

install:
	mkdir -p $(CGI_DIR)
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $(CGI_DIR)/$(TARGET) $(OBJECTS) $(TARGET).cpp $(LIBSTOCKER_COMMON)

