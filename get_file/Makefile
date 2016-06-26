debug=1

TARGET=get_file
OBJECTS=get_file.o fileutil.o cgi_util.o Range.o
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

.phony: all clean install

all: $(TARGET)

%.o: %.cpp %.h
	$(CPP) $(CPPFLAGS) -o $@ -c $<

$(TARGET): $(OBJECTS)
	$(CPP) $(CPPFLAGS) -o $@ $^

clean:
	$(RM) $(TARGET) $(OBJECTS) *~

install: $(TARGET)
	mkdir -p $(CGI_DIR)
	cp $(TARGET) $(CGI_DIR)
