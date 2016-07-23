debug=1

TARGET=libcommonmodule.a
OBJECTS=fileutil.o cgi_util.o Config.o htmlutil.o
CC=gcc
CPP=g++

ifeq ($(debug), 1)
	CFLAGS=-g -Wall
else
	CFLAGS=-O2 -Wall -DNDEBUG
endif
CPPFLAGS=$(CFLAGS)

DESTDIR   = /var/www
CGI_DIR   = $(DESTDIR)/cgi-bin/stocker
BASE_DIR  = $(DESTDIR)/stocker
BIN_DIR   = $(BASE_DIR)/bin
CONF_DIR  = $(BASE_DIR)/conf

.phony: all clean install

all: $(TARGET)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

clean:
	$(RM) $(TARGET) $(OBJECTS) *~

$(TARGET): $(OBJECTS)
	ar rv $@ $^
