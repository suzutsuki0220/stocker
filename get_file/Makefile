debug=1

TARGET=get_file
OBJECTS=fileutil.o cgi_util.o Range.o Config.o
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

all: $(OBJECTS)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

$(TARGET): $(OBJECTS) get_file.cpp .dummy.h
	$(CPP) $(CPPFLAGS) -DCONFDIR=\"$(CONF_DIR)\" -o $@ $^
	$(RM) .dummy.h

clean:
	$(RM) $(TARGET) $(OBJECTS) get_file.o .dummy.h *~

.dummy.h:
	@if [ ! -f $@ ]; then touch $@; fi

install: $(TARGET)
	mkdir -p $(CGI_DIR)
	cp $(TARGET) $(CGI_DIR)
